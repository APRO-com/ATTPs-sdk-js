interface Metadata {
  contentType: string
  encoding: string
  compression: string
}

interface CreateManagerParams {
  rpcUrl: string
  privateKey: string
  proxyAddress: string
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
    version?: string
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
  signers: string[]
  metadata: Metadata
}

interface VerifyParams {
  payload: MessagePayload
  agent?: string
  digest?: string
  transactionOptions?: TransactionOptions
}

export {
  AgentSettings,
  CreateAgentParams,
  CreateAndRegisterAgentParams,
  CreateManagerParams,
  MessagePayload,
  TransactionOptions,
  VerifyParams,
}
