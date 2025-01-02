import type { Provider, Wallet } from 'ethers'

interface Proofs {
  zkProof: string
  merkleProof: string
  signatureProof: string
}

interface Metadata {
  contentType: string
  encoding: string
  compression: string
}

interface MessagePayload {
  data: string
  dataHash: string
  proofs: Proofs
  metadata: Metadata
}

interface AgentSettings {
  signers: string[]
  threshold: number
  converterAddress: string
  agentHeader: {
    version: string
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

interface CreateManagerParams {
  proxyAddress: string
  wallet: Wallet
}

interface CreateConverterParams {
  converterAddress: string
  provider: Provider
}

interface CreateAgentParams extends CreateManagerParams {
  converterAddress: string
  agent?: string
  digest?: string
}

interface VerifyParams {
  payload: MessagePayload
  agent?: string
  digest?: string
}

interface CreateAndRegisterAgentParams {
  agentSettings: AgentSettings
}

export {
  AgentSettings,
  CreateAgentParams,
  CreateAndRegisterAgentParams,
  CreateConverterParams,
  CreateManagerParams,
  MessagePayload,
  VerifyParams,
}
