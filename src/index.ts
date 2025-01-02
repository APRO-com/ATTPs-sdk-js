import type { CreateAgentParams, CreateAndRegisterAgentParams, CreateManagerParams, VerifyParams } from './types'
import { Contract, keccak256 } from 'ethers'
import { AiAgentError } from './errors'
import { converterAbi, createAndRegisterAgentAbi, verifyAbi } from './function'
import { prependHexPrefix } from './utils'

function createManager({ proxyAddress, wallet }: CreateManagerParams) {
  const contract = new Contract(proxyAddress, createAndRegisterAgentAbi, wallet)

  return {
    createAndRegisterAgent: async ({ agentSettings }: CreateAndRegisterAgentParams): Promise<string> => {
      const tx = await contract.createAndRegisterAgent(agentSettings)
      return tx.hash
    },
  }
}

function createAgent({ proxyAddress, converterAddress, wallet, agent, digest }: CreateAgentParams) {
  const proxyContract = new Contract(proxyAddress, verifyAbi, wallet)
  const converterContract = new Contract(converterAddress, converterAbi, wallet)

  const globalAgent = agent
  const globalDigest = digest

  async function converter(data: string): Promise<string> {
    return await converterContract.converter(data)
  }

  return {
    verify: async ({ payload, agent, digest }: VerifyParams): Promise<string> => {
      agent = agent || globalAgent
      digest = digest || globalDigest

      if (!agent || !digest) {
        throw new AiAgentError('PARAMETER_ERROR', 'Agent and settings digest must be provided, you can set them globally or pass them as arguments')
      }

      const tx = await proxyContract.verify(agent, prependHexPrefix(digest), payload)
      return tx.hash
    },
    getDataHash: async (data: string): Promise<string> => {
      const result = await converter(data)
      return keccak256(result)
    },
  }
}

export {
  createAgent,
  createManager,
}
