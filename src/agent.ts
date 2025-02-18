import type { ContractTransactionResponse, Provider } from 'ethers'
import type { ATTPsSDKProps, CreateAndRegisterAgentParams, VerifyParams } from './schema/validator'
import { Contract, getDefaultProvider, keccak256, Wallet } from 'ethers'
import * as v from 'valibot'
import { agentManagerAbi, agentProxyAbi, converterAbi } from './schema/abi'
import { ATTPsError } from './schema/errors'
import { ATTPsSDKPropsSchema, CreateAndRegisterAgentSchema, VerifySchema } from './schema/validator'
import { encodeSignatures } from './utils'

interface FullAgentSettings {
  signers: string[]
  threshold: number
  converterAddress: string
  agentHeader: {
    version?: string
    messageId: string
    sourceAgentId: string
    sourceAgentName: string
    targetAgentId: string
    timestamp: number
    messageType: number
    priority: number
    ttl: number
  }
}

class ATTPsSDK {
  private autoHashData: boolean
  private wallet: Wallet
  private provider: Provider
  private proxyContract: Contract
  private converterContract?: Contract
  private ManagerContract?: Contract

  constructor(props: ATTPsSDKProps) {
    const p = v.safeParse(ATTPsSDKPropsSchema, props)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    const { rpcUrl, privateKey, proxyAddress, converterAddress, autoHashData } = p.output
    this.autoHashData = autoHashData

    const provider = getDefaultProvider(rpcUrl)
    const wallet = new Wallet(privateKey, provider)

    this.wallet = wallet
    this.provider = provider
    this.proxyContract = new Contract(proxyAddress, agentProxyAbi, wallet)

    if (converterAddress) {
      this.converterContract = new Contract(converterAddress, converterAbi, wallet)
    }
  }

  public createAndRegisterAgent = async (params: CreateAndRegisterAgentParams): Promise<ContractTransactionResponse> => {
    const p = v.safeParse(CreateAndRegisterAgentSchema, params)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    const { agentSettings, transactionOptions } = p.output
    const { agentHeader } = agentSettings as FullAgentSettings
    const managerContract = await this.getManagerContract()
    agentHeader.version = await managerContract.agentVersion()

    if (!await managerContract.isValidSourceAgentId(agentHeader.sourceAgentId)) {
      throw new ATTPsError('PARAMETER_ERROR', 'Invalid source agent id, please provide a new one')
    }

    return await this.proxyContract.createAndRegisterAgent(agentSettings, transactionOptions)
  }

  public verify = async (params: VerifyParams): Promise<ContractTransactionResponse> => {
    const p = v.safeParse(VerifySchema, params)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    const { payload, agent, digest, transactionOptions } = p.output
    if (this.autoHashData) {
      payload.dataHash = keccak256(await this.converter(payload.data))
    }
    if (!payload.dataHash) {
      throw new ATTPsError('PARAMETER_ERROR', 'dataHash is required')
    }

    const signatureProof = encodeSignatures(payload.signatures)
    return await this.proxyContract.verify(agent, digest, {
      data: payload.data,
      dataHash: payload.dataHash,
      proofs: {
        zkProof: '0x',
        merkleProof: '0x',
        signatureProof,
      },
      metadata: payload.metadata,
    }, transactionOptions)
  }

  public getNextNonce = async () => {
    return this.wallet.getNonce()
  }

  private converter = async (data: string) => {
    return await this.converterContract!.converter(data)
  }

  private getManagerContract = async () => {
    if (this.ManagerContract) {
      return this.ManagerContract
    }

    const managerAddress = await this.proxyContract.agentManager()
    this.ManagerContract = new Contract(managerAddress, agentManagerAbi, this.provider)
    return this.ManagerContract
  }
}

export {
  ATTPsSDK,
}
