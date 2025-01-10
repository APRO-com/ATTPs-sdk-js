import type { AgentSettings, MessagePayload, TransactionOptions } from '@/index'
import { AgentSDK, parseNewAgentAddress } from '@/index'
import { uuidv4 } from '@/utils'
import { hexlify, keccak256, parseUnits, toUtf8Bytes } from 'ethers'
import { describe, expect, it } from 'vitest'
import testData from '../data.json'
import { randomSigners } from './helper'

describe('create and register agent', async () => {
  const { rpcUrl, agentProxy, privateKey, apro, custom } = testData
  const signers = await randomSigners(5)

  it('with fully customized agent settings and transaction options', async () => {
    // Given
    const { converter } = apro
    const agent = new AgentSDK({ rpcUrl, privateKey, proxyAddress: agentProxy })
    const nonce = await agent.getNextNonce()

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        messageId: uuidv4(),
        sourceAgentId: uuidv4(),
        sourceAgentName: 'AI Agent SDK JS',
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
    const tx = await agent.createAndRegisterAgent({ agentSettings, transactionOptions })
    console.log('createAndRegisterAgent txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)

    const agentAddress = parseNewAgentAddress(receipt)
    expect(agentAddress).toBeTruthy()

    console.log('agentAddress', agentAddress)
  })

  it('with partial customized agent settings and transaction options', async () => {
    // Given
    const { converter } = custom
    const agent = new AgentSDK({ rpcUrl, privateKey, proxyAddress: agentProxy })

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        sourceAgentName: 'AI Agent SDK JS',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const transactionOptions: TransactionOptions = {
      gasPrice: parseUnits('1', 'gwei'),
    }
    const tx = await agent.createAndRegisterAgent({ agentSettings, transactionOptions })
    console.log('createAndRegisterAgent txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)

    const agentAddress = parseNewAgentAddress(receipt)
    expect(agentAddress).toBeTruthy()

    console.log('agentAddress', agentAddress)
  })

  it('with partial customized agent settings and default transaction options', async () => {
    // Given
    const { converter } = apro
    const agent = new AgentSDK({ proxyAddress: agentProxy, rpcUrl, privateKey })

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        sourceAgentName: 'AI Agent SDK JS',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const tx = await agent.createAndRegisterAgent({ agentSettings })
    console.log('createAndRegisterAgent txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)

    const agentAddress = parseNewAgentAddress(receipt)
    expect(agentAddress).toBeTruthy()

    console.log('agentAddress', agentAddress)
  })
})

describe('verify a report', () => {
  const { rpcUrl, agentProxy, privateKey, apro, custom } = testData

  it('should verify an apro data pull report', async () => {
    // Given
    const { converter, agentAddress, configDigest } = apro
    const agent = new AgentSDK({
      proxyAddress: agentProxy,
      rpcUrl,
      privateKey,
      autoHashData: true,
      converterAddress: converter, // converter must be provided if autoHashData is true
    })

    const fullReport = '0x0006e706cf7ab41fa599311eb3de68be869198ce62aef1cd079475ca50e5b3f60000000000000000000000000000000000000000000000000000000003fe4907000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a0010001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d648900000000000000000000000000000000000000000000000000000000677f779100000000000000000000000000000000000000000000000000000000677f779100000000000000000000000000000000000000000000000000000362005570e800000000000000000000000000000000000000000000000004db732547630000000000000000000000000000000000000000000000000000000000006780c9110000000000000000000000000000000000000000000013ed2bdfd551102380000000000000000000000000000000000000000000000013ed2b72c3d44d88c0000000000000000000000000000000000000000000000013ed3369aad6b22180000000000000000000000000000000000000000000000000000000000000000003097dda4dd6f7113a710c9b5b56ce458c0791469bb5de01a71a5413ff43eb8b2a2e2d7e199e08106cf2a6308a7af2e339b11bf87bfa4a5593f6f4282396360a9d7a4eff209893782d721486177d6b667658d386f790eb64346c25d12251316b4300000000000000000000000000000000000000000000000000000000000000036249bbc444f934de2707d20502de7439be8c077d34dd196cfe19bb6e5e251a3a27a333dafc80196d062406cae35c7ff5225f7fbc97c48a178fa1190e87d096db146827e5d0f00b890772178971db330e8357282b196db806b8a5042de7de12d2'
    const payload: MessagePayload = {
      data: fullReport,
      signatures: [
        {
          r: '097dda4dd6f7113a710c9b5b56ce458c0791469bb5de01a71a5413ff43eb8b2a',
          s: '6249bbc444f934de2707d20502de7439be8c077d34dd196cfe19bb6e5e251a3a',
          v: 1, // or 28
        },
        {
          r: '2e2d7e199e08106cf2a6308a7af2e339b11bf87bfa4a5593f6f4282396360a9d',
          s: '27a333dafc80196d062406cae35c7ff5225f7fbc97c48a178fa1190e87d096db',
          v: 0, // or 27
        },
        {
          r: '7a4eff209893782d721486177d6b667658d386f790eb64346c25d12251316b43',
          s: '146827e5d0f00b890772178971db330e8357282b196db806b8a5042de7de12d2',
          v: 1, // or 28
        },
      ],
      metadata: {
        contentType: 'application/abi',
        encoding: 'null',
        compression: 'null',
      },
    }

    // When
    const tx = await agent.verify({ payload, agent: agentAddress, digest: configDigest })
    console.log('verify txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)
  })

  it('should verify a custom report', async () => {
    // Given
    const { agentAddress, configDigest } = custom
    const agent = new AgentSDK({
      proxyAddress: agentProxy,
      rpcUrl,
      privateKey,
    })
    const nonce = await agent.getNextNonce()

    const data = hexlify(toUtf8Bytes('Hello World!'))
    const dataHash = keccak256(data)
    const payload: MessagePayload = {
      data,
      dataHash,
      signatures: [
        {
          r: '944077ec69cbba1a1ca86556c51786ab7cb0b7769c09fd135613817e00f01707',
          s: '6c53ba26ec3db0ff48d00084414a2ae89af470ca4b65805794b2cb11409b616c',
          v: 28, // or 1
        },
        {
          r: '079570c191da21106916d1b2badec3866693f1c33fca8e593d13c006b8f2f8b3',
          s: '2f1747b281585d62894605e354355f8c4b53c805162939fa1b71bde2dd5747da',
          v: 27, // or 0
        },
        {
          r: 'de592b3b7b50fd0eaebb943109e67165f3858034599debccaf99a11f42f31704',
          s: '713bd639340928b4df4d50d39b39e7c61859b3894c6549e8b075210e2604d9b4',
          v: 28, // or 1
        },
      ],
    }
    const transactionOptions: TransactionOptions = {
      nonce,
      gasPrice: parseUnits('1', 'gwei'),
      gasLimit: BigInt(500000),
    }

    // When
    const tx = await agent.verify({ payload, agent: agentAddress, digest: configDigest, transactionOptions })
    console.log('verify txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)
  })
})
