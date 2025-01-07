import type { AgentSettings, CreateAgentParams, CreateAndRegisterAgentParams, CreateManagerParams, TransactionOptions, VerifyParams } from './schema/types'
import { AbiCoder, Contract, getDefaultProvider, keccak256, Wallet } from 'ethers'
import * as v from 'valibot'
import { AiAgentError } from './errors'
import { agentManagerAbi, agentProxyAbi, converterAbi } from './schema/function'
import { CreateAgentSchema, CreateAndRegisterAgentSchema, CreateManagerSchema, VerifySchema } from './schema/validator'

const ZeroAddress = '0x0000000000000000000000000000000000000000'

function createManager(params: CreateManagerParams) {
  const p = v.safeParse(CreateManagerSchema, params)
  if (!p.success) {
    throw new AiAgentError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
  }

  const { proxyAddress, rpcUrl, privateKey } = p.output
  const provider = getDefaultProvider(rpcUrl)
  const wallet = new Wallet(privateKey, provider)
  const proxyContract = new Contract(proxyAddress, agentProxyAbi, wallet)

  async function agentManager(): Promise<Contract> {
    const managerAddress = await proxyContract.agentManager()
    return new Contract(managerAddress, agentManagerAbi, provider)
  }

  async function agentVersion(managerContract: Contract): Promise<string> {
    return await managerContract.agentVersion()
  }

  async function isValidMessageId(managerContract: Contract, messageId: string): Promise<boolean> {
    return await managerContract.isValidMessageId(messageId)
  }

  async function isValidSourceAgentId(managerContract: Contract, sourceAgentId: string): Promise<boolean> {
    return await managerContract.isValidSourceAgentId(sourceAgentId)
  }

  return {
    createAndRegisterAgent: async (params: CreateAndRegisterAgentParams) => {
      const p = v.safeParse(CreateAndRegisterAgentSchema, params)
      if (!p.success) {
        throw new AiAgentError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
      }

      const { agentSettings, transactionOptions } = p.output
      const { agentHeader } = agentSettings
      const agentManagerContract = await agentManager()
      const version = await agentVersion(agentManagerContract)

      if (!await isValidMessageId(agentManagerContract, agentHeader.messageId)) {
        throw new AiAgentError('PARAMETER_ERROR', 'Invalid message id, please provide a new one')
      }
      if (!await isValidSourceAgentId(agentManagerContract, agentHeader.sourceAgentId)) {
        throw new AiAgentError('PARAMETER_ERROR', 'Invalid source agent id, please provide a new one')
      }

      return await proxyContract.createAndRegisterAgent({
        ...agentSettings,
        agentHeader: {
          ...agentHeader,
          version,
        },
      }, transactionOptions)
    },
    getNextNonce: async () => {
      return await provider.getTransactionCount(wallet.address)
    },
  }
}

function createAgent(params: CreateAgentParams) {
  const p = v.safeParse(CreateAgentSchema, params)
  if (!p.success) {
    throw new AiAgentError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
  }

  const { proxyAddress, converterAddress, rpcUrl, privateKey, agent, digest } = p.output
  const provider = getDefaultProvider(rpcUrl)
  const wallet = new Wallet(privateKey, provider)
  const proxyContract = new Contract(proxyAddress, agentProxyAbi, wallet)
  const converterContract = new Contract(converterAddress, converterAbi, wallet)

  const globalAgent = agent
  const globalDigest = digest

  async function converter(data: string): Promise<string> {
    return await converterContract.converter(data)
  }

  return {
    verify: async (params: VerifyParams) => {
      const p = v.safeParse(VerifySchema, params)
      if (!p.success) {
        throw new AiAgentError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
      }

      let { payload, agent, digest, transactionOptions } = p.output
      agent = agent || globalAgent
      digest = digest || globalDigest

      if (!agent || !digest) {
        throw new AiAgentError('PARAMETER_ERROR', 'Agent and settings digest must be provided, you can set them globally or pass them as arguments')
      }

      let dataHash
      if (!converterAddress || ZeroAddress === converterAddress) {
        dataHash = keccak256(payload.data)
      }
      else {
        dataHash = keccak256(await converter(payload.data))
      }

      const signatureProof = await encodeSignaturesToString(dataHash, payload.signers)
      return await proxyContract.verify(agent, digest, {
        data: payload.data,
        dataHash,
        proofs: {
          zkProof: '0x',
          merkleProof: '0x',
          signatureProof,
        },
        metadata: payload.metadata,
      }, transactionOptions)
    },
    getNextNonce: async () => {
      return await provider.getTransactionCount(wallet.address)
    },
  }
}

async function encodeSignaturesToString(dataHash: string, signers: string[]): Promise<string> {
  try {
    const signatures = signers.map(s => new Wallet(s).signingKey.sign(dataHash))

    const rs = signatures.map(sig => sig.r)
    const ss = signatures.map(sig => sig.s)
    const vs = signatures.map(sig => sig.v - 27)

    const abiCoder = AbiCoder.defaultAbiCoder()
    return abiCoder.encode(
      ['bytes32[]', 'bytes32[]', 'uint8[]'],
      [rs, ss, vs],
    )
  }
  catch (e: any) {
    throw new AiAgentError('PARAMETER_ERROR', `Failed to encode signatures, make sure to provide valid signer private keys, error: ${e.message}`)
  }
}

export {
  createAgent,
  createManager,
}

export type {
  AgentSettings,
  CreateAndRegisterAgentParams,
  CreateManagerParams,
  TransactionOptions,
}
