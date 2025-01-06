import type { AgentSettings, MessagePayloadInput, TransactionOptions } from '@/schema/types'
import { createAgent, createManager } from '@/index'
import { uuidv4 } from '@/utils'
import { getDefaultProvider, parseUnits, Wallet } from 'ethers'
import { describe, expect, it } from 'vitest'

describe('create and register agent', () => {
  const { RPC_URL, AGENT_PROXY, PRIVATE_KEY, CONVERTER, SIGNERS } = process.env
  if (!RPC_URL || !AGENT_PROXY || !PRIVATE_KEY || !CONVERTER || !SIGNERS) {
    throw new Error('Missing environment variables, make sure to update .env file before running tests')
  }

  it('with fully customized agent settings and transaction options', async () => {
    // Given
    const provider = getDefaultProvider(RPC_URL)
    const wallet = new Wallet(PRIVATE_KEY, provider)
    const nonce = await provider.getTransactionCount(wallet.address)

    const manager = createManager({ proxyAddress: AGENT_PROXY, rpcUrl: RPC_URL, privateKey: PRIVATE_KEY })

    // When
    const agentSettings: AgentSettings = {
      signers: SIGNERS.split(','),
      threshold: 2,
      converterAddress: CONVERTER,
      agentHeader: {
        // version: '1.0',
        messageId: uuidv4(),
        sourceAgentId: uuidv4(),
        sourceAgentName: 'APRO Data Pull',
        targetAgentId: uuidv4(),
        timestamp: Math.floor(Date.now() / 1000),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const transactionOptions: TransactionOptions = {
      nonce,
      gasPrice: parseUnits('1', 'gwei'),
      gasLimit: BigInt(2000000),
    }
    const tx = await manager.createAndRegisterAgent({ agentSettings, transactionOptions })

    // Then
    expect(tx).toBeDefined()
    console.log('txHash', tx.hash)
  })

  it('with partial customized agent settings and transaction options', async () => {
    // Given
    const manager = createManager({ proxyAddress: AGENT_PROXY, rpcUrl: RPC_URL, privateKey: PRIVATE_KEY })

    // When
    const agentSettings: AgentSettings = {
      signers: SIGNERS.split(','),
      threshold: 2,
      converterAddress: CONVERTER,
      agentHeader: {
        sourceAgentName: 'APRO Data Pull',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const transactionOptions: TransactionOptions = {
      gasPrice: parseUnits('1', 'gwei'),
    }
    const tx = await manager.createAndRegisterAgent({ agentSettings, transactionOptions })

    // Then
    expect(tx).toBeDefined()
    console.log('txHash', tx.hash)
  })

  it('with partial customized agent settings and default transaction options', async () => {
    // Given
    const manager = createManager({ proxyAddress: AGENT_PROXY, rpcUrl: RPC_URL, privateKey: PRIVATE_KEY })

    // When
    const agentSettings: AgentSettings = {
      signers: SIGNERS.split(','),
      threshold: 2,
      converterAddress: CONVERTER,
      agentHeader: {
        sourceAgentName: 'APRO Data Pull',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const tx = await manager.createAndRegisterAgent({ agentSettings })

    // Then
    expect(tx).toBeDefined()
    console.log('txHash', tx.hash)
  })
})

describe('agent operations', () => {
  const { RPC_URL, AGENT_PROXY, PRIVATE_KEY, CONVERTER, AGENT_ADDRESS, CONFIG_DIGEST, SIGNER_PRIVATE_KEYS } = process.env
  if (!RPC_URL || !AGENT_PROXY || !PRIVATE_KEY || !CONVERTER || !AGENT_ADDRESS || !CONFIG_DIGEST || !SIGNER_PRIVATE_KEYS) {
    throw new Error('Missing environment variables, make sure to update .env file before running tests')
  }

  it('should verify a report', async () => {
    // Given
    const agent = createAgent({
      proxyAddress: AGENT_PROXY,
      converterAddress: CONVERTER,
      rpcUrl: RPC_URL,
      privateKey: PRIVATE_KEY,
      agent: AGENT_ADDRESS,
      digest: CONFIG_DIGEST,
    })

    const fullReport = '0x0006e706cf7ab41fa599311eb3de68be869198ce62aef1cd079475ca50e5b3f6000000000000000000000000000000000000000000000000000000000398b30d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a0000101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d64890000000000000000000000000000000000000000000000000000000067767b9b0000000000000000000000000000000000000000000000000000000067767b9b0000000000000000000000000000000000000000000000000000034b059c9b6000000000000000000000000000000000000000000000000004db732547630000000000000000000000000000000000000000000000000000000000006777cd1b000000000000000000000000000000000000000000001478388b5e1beec1800000000000000000000000000000000000000000000000147837deb4aaa6ac0000000000000000000000000000000000000000000000001478416ff25062d38000000000000000000000000000000000000000000000000000000000000000000328383610077fc05b53b891b0cb7db3cefc6140acdc3760cc068befe3eb12316552c7948ce1875c1673aaa6b0a2ea5043e85be8475bedda78536ac402a1f9aa311a3400aa138e130775513f13ebd0f6c0de4de7d0f85434a30042c3fefe979abe00000000000000000000000000000000000000000000000000000000000000030cf76ab98d3da13106e7c08b7143122096038a468309664def33b28f5208e1e9489362293b5ffab2152fe59fb5fa83eadb12b3075ea8aaca64cbde3349c6b332370b3510f70b6d17855be8241426718c119a4bbb2d0dc2b5af00b7e0860e9721'
    const payload: MessagePayloadInput = {
      data: fullReport,
      signers: SIGNER_PRIVATE_KEYS.split(','),
      metadata: {
        contentType: 'application/abi',
        encoding: 'null',
        compression: 'null',
      },
    }

    // When
    const txHash = await agent.verify({ payload })

    // Then
    console.log('txHash', txHash)
  })
})
