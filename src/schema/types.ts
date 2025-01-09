interface Metadata {
  contentType: string
  encoding: string
  compression: string
}

interface AgentSettings {
  signers: string[]
  threshold: number
  converterAddress: string
  agentHeader: {
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

interface MessagePayload {
  data: string
  dataHash?: string
  signatures: Signature[]
  metadata: Metadata
}

interface VerifyParams {
  agent: string
  digest: string
  payload: MessagePayload
  transactionOptions?: TransactionOptions
}

interface AgentSDKProps {
  rpcUrl: string
  privateKey: string
  proxyAddress: string
  converterAddress?: string
  autoHashData?: boolean
}

interface Signature {
  r: string
  s: string
  v: 1 | 0 | 27 | 28
}

export {
  AgentSDKProps,
  AgentSettings,
  CreateAndRegisterAgentParams,
  MessagePayload,
  Signature,
  TransactionOptions,
  VerifyParams,
}
