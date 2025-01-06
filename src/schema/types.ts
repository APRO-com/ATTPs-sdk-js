import type { Provider } from 'ethers'

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

interface CreateManagerParams {
  rpcUrl: string
  privateKey: string
  proxyAddress: string
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

interface AgentSettings {
  signers: string[]
  threshold: number
  converterAddress: string
  agentHeader: {
    // version?: string
    messageId?: string
    sourceAgentId?: string
    sourceAgentName: string
    targetAgentId: string
    timestamp?: number
    messageType: number
    priority: number
    ttl: number
  }
}

interface TransactionOptions {
  nonce?: number
  gasLimit?: bigint
  gasPrice?: bigint
}

interface CreateAndRegisterAgentParams {
  agentSettings: AgentSettings
  transactionOptions?: TransactionOptions
}

interface MessagePayloadInput {
  data: string
  signers: string[]
  metadata: Metadata
}

interface VerifyParams {
  payload: MessagePayloadInput
  agent?: string
  digest?: string
  transactionOptions?: TransactionOptions
}

export {
  AgentSettings,
  CreateAgentParams,
  CreateAndRegisterAgentParams,
  CreateConverterParams,
  CreateManagerParams,
  MessagePayload,
  MessagePayloadInput,
  TransactionOptions,
  VerifyParams,
}
