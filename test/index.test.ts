import type { AgentSettings, MessagePayload, TransactionOptions } from '@/schema/types'
import { createAgent, createManager } from '@/index'
import { uuidv4 } from '@/utils'
import { hexlify, parseUnits, toUtf8Bytes } from 'ethers'
import { describe, expect, it } from 'vitest'
import testData from '../data.json'

describe('create and register agent', () => {
  const { rpcUrl, agentProxy, privateKey, apro, custom } = testData

  it('with fully customized agent settings and transaction options', async () => {
    // Given
    const { converter, signerAddresses } = apro
    const manager = createManager({ proxyAddress: agentProxy, rpcUrl, privateKey })
    const nonce = await manager.getNextNonce()

    // When
    const agentSettings: AgentSettings = {
      signers: signerAddresses,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        version: '1.0',
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
    console.log('txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt.status).toBe(1)
  })

  it('with partial customized agent settings and transaction options', async () => {
    // Given
    const { converter, signerAddresses } = custom
    const manager = createManager({ proxyAddress: agentProxy, rpcUrl, privateKey })

    // When
    const agentSettings: AgentSettings = {
      signers: signerAddresses,
      threshold: 3,
      converterAddress: converter,
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
    console.log('txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt.status).toBe(1)
  })

  it('with partial customized agent settings and default transaction options', async () => {
    // Given
    const { converter, signerAddresses } = apro
    const manager = createManager({ proxyAddress: agentProxy, rpcUrl, privateKey })

    // When
    const agentSettings: AgentSettings = {
      signers: signerAddresses,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        sourceAgentName: 'APRO Data Pull',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const tx = await manager.createAndRegisterAgent({ agentSettings })
    console.log('txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt.status).toBe(1)
  })
})

describe('verify a report', () => {
  const { rpcUrl, agentProxy, privateKey, apro, custom } = testData

  it('should verify an apro data pull report', async () => {
    // Given
    const { converter, agentAddress, configDigest, signerPrivateKeys } = apro
    const agent = createAgent({
      proxyAddress: agentProxy,
      converterAddress: converter,
      rpcUrl,
      privateKey,
      agent: agentAddress,
      digest: configDigest,
    })

    const fullReport = '0x0006e706cf7ab41fa599311eb3de68be869198ce62aef1cd079475ca50e5b3f60000000000000000000000000000000000000000000000000000000003e05306000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a0000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d648900000000000000000000000000000000000000000000000000000000677cdb6800000000000000000000000000000000000000000000000000000000677cdb6800000000000000000000000000000000000000000000000000000320e6d7a71c00000000000000000000000000000000000000000000000004db73254763000000000000000000000000000000000000000000000000000000000000677e2ce800000000000000000000000000000000000000000000158bcf23916e0934c00000000000000000000000000000000000000000000000158bceb5ca0b25a5800000000000000000000000000000000000000000000000158bcff0ea393d3940000000000000000000000000000000000000000000000000000000000000000003c5096aec1e09c4f31e18977cbf116a6019890f6ccfee73d33d4cc692c9a4158eba28489661a3dd78bfbe2491e40bd801279a5cff08a53ce0f3191573cb66ab8ddbf7a60a80db2a9d17bc79c8a96a0199c729311158e3eb9dc1f7f4e0e00cdcdb0000000000000000000000000000000000000000000000000000000000000003586101390e85a09adfe72d20a588685701dee06bfc734d632af202e2c0e1be792eae6b4b53fc6b851a9651c07540631d4a60eee517a9ea1539627e19574b59c916a8a89bc66211d992d98512089c828716bf95962c3355139b7f31e64aa4bd14'
    const payload: MessagePayload = {
      data: fullReport,
      signers: signerPrivateKeys.slice(0, 3),
      metadata: {
        contentType: 'application/abi',
        encoding: 'null',
        compression: 'null',
      },
    }

    // When
    const tx = await agent.verify({ payload })
    console.log('txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt.status).toBe(1)
  })

  it('should verify a custom report', async () => {
    // Given
    const { converter, agentAddress, configDigest, signerPrivateKeys } = custom
    const agent = createAgent({
      proxyAddress: agentProxy,
      converterAddress: converter,
      rpcUrl,
      privateKey,
      agent: agentAddress,
      digest: configDigest,
    })
    const nonce = await agent.getNextNonce()

    const fullReport = hexlify(toUtf8Bytes('hello world'))
    const payload: MessagePayload = {
      data: fullReport,
      signers: signerPrivateKeys.slice(0, 3),
      metadata: {
        contentType: 'application/abi',
        encoding: 'null',
        compression: 'null',
      },
    }
    const transactionOptions: TransactionOptions = {
      nonce,
      gasPrice: parseUnits('1', 'gwei'),
      gasLimit: BigInt(500000),
    }

    // When
    const tx = await agent.verify({ payload, transactionOptions })
    console.log('txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt.status).toBe(1)
  })
})
