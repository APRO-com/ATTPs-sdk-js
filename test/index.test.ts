import type { AgentSettings, MessagePayload, PayloadData, TransactionOptions } from '@/index'
import { randomUUID } from 'node:crypto'
import { AproReportParser, ATTPsSDK, parseNewAgentAddress } from '@/index'
import { uuidv4 } from '@/utils'
import { hexlify, keccak256, parseUnits, toUtf8Bytes } from 'ethers'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import testData from '../data.json'
import { randomSigners, server } from './helper'

describe('create and register agent', async () => {
  const { rpcUrl, agentProxy, privateKey, apro, custom } = testData
  const signers = await randomSigners(5)

  it('with fully customized agent settings and transaction options', async () => {
    // Given
    const { converter } = apro
    const attps = new ATTPsSDK({ rpcUrl, privateKey, proxyAddress: agentProxy })
    const nonce = await attps.getNextNonce()

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        messageId: uuidv4(),
        sourceAgentId: uuidv4(),
        sourceAgentName: 'ATTPs SDK JS',
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
    const tx = await attps.createAndRegisterAgent({ agentSettings, transactionOptions })
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
    const attps = new ATTPsSDK({ rpcUrl, privateKey, proxyAddress: agentProxy })

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        sourceAgentName: 'ATTPs SDK JS',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const transactionOptions: TransactionOptions = {
      gasPrice: parseUnits('1', 'gwei'),
    }
    const tx = await attps.createAndRegisterAgent({ agentSettings, transactionOptions })
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
    const attps = new ATTPsSDK({ proxyAddress: agentProxy, rpcUrl, privateKey })

    // When
    const agentSettings: AgentSettings = {
      signers,
      threshold: 3,
      converterAddress: converter,
      agentHeader: {
        sourceAgentName: 'ATTPs SDK JS',
        targetAgentId: uuidv4(),
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }
    const tx = await attps.createAndRegisterAgent({ agentSettings })
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
    const attps = new ATTPsSDK({
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
    const tx = await attps.verify({ payload, agent: agentAddress, digest: configDigest })
    console.log('verify txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)
  })

  it('should verify a custom report', async () => {
    // Given
    const { agentAddress, configDigest } = custom
    const attps = new ATTPsSDK({
      proxyAddress: agentProxy,
      rpcUrl,
      privateKey,
    })
    const nonce = await attps.getNextNonce()

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
    const tx = await attps.verify({ payload, agent: agentAddress, digest: configDigest, transactionOptions })
    console.log('verify txHash', tx.hash)

    // Then
    const receipt = await tx.wait()
    expect(receipt?.status).toBe(1)
  })
})

describe('vrf operations', () => {
  const vrfBackendUrl = 'http://localhost:3000'

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('should get vrf providers', async () => {
    // Given
    const attps = new ATTPsSDK({
      vrfBackendUrl,
    })

    // When
    const providers = await attps.getVrfProviders()

    // Then
    expect(providers).toHaveLength(1)
    expect(providers[0]).toEqual({
      address: '0x1234567890123456789012345678901234567890',
      keyHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    })
  })

  it('should mark a vrf request', async () => {
    // Given
    const attps = new ATTPsSDK({
      vrfBackendUrl,
    })

    const requestParams = {
      version: 1,
      targetAgentId: randomUUID(),
      clientSeed: '1234',
      keyHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      requestTimestamp: Math.floor(Date.now() / 1000),
      callbackUri: 'https://example.com/callback',
    }

    // When
    const requestId = await attps.markVrfRequest(requestParams)

    // Then
    expect(requestId).toBe('0x9876543210987654321098765432109876543210')
  })

  it('should get a vrf request', async () => {
    // Given
    const attps = new ATTPsSDK({
      vrfBackendUrl,
    })

    const requestId = '0x9876543210987654321098765432109876543210'

    // When
    const response = await attps.getVrfRequest(requestId)

    // Then
    expect(response.requestId).toBe(requestId)
    expect(response.proof).toBeDefined()
    expect(response.proof.publicX).toBe('4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa')
    expect(response.proof.publicY).toBe('385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1')
  })

  it('should verify a vrf proof', async () => {
    // Given
    const attps = new ATTPsSDK({})

    const proof = {
      publicX: '0x4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
      publicY: '0x385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1',
      gammaX: '514d3c0e04b958722dde4fd07edd4cb0ff8564dec00071f43a183571491dc854',
      gammaY: 'de06c37d5bd2706cdd21b92af8c0c27d27209f9938fb7d6e8a2fd5e0f0851b61',
      c: 'eade17723b6f478e422c59da28f9fec2b3ec5308cbad011a062240db4462c8bd',
      s: 'a64613a6c2c2b8dba9cadcff79a3d6db7c973a03cdb41c8654946bc5af2fa2f0',
      seed: '847bf2c5404da462a157fe569ba535bd6f24e6056c957c975ae5d9ef5e1bfa73',
      output: 'ecdd27817867152f88d58f9480a21ab95b26f6bbf5ff816f86b781865b562f96',
    }

    // When
    const verified = await attps.verifyProof(proof)

    // Then
    expect(verified).toBe(true)
  })

  it('should handle vrf request error', async () => {
    // Given
    const attps = new ATTPsSDK({
      vrfBackendUrl,
    })

    server.use(
      http.get('*/api/vrf/provider', () => {
        return HttpResponse.json({
          message: 'VRF_REQUEST_ERROR',
          code: 1,
          result: null,
          responseEnum: 'ERROR',
        }, { status: 400 })
      }),
    )

    // When & Then
    await expect(attps.getVrfProviders()).rejects.toThrow('VRF_REQUEST_ERROR')
  })
})

describe('report parser', () => {
  it('should parse a apro report', async () => {
    // Given
    const hexData = '0x00067f925361b2ab26a59cc1997a5c064b3eeb4c9c39262caaf616b42d1ad1320000000000000000000000000000000000000000000000000000000002742b13000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000280000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d64890000000000000000000000000000000000000000000000000000000067641f330000000000000000000000000000000000000000000000000000000067641f330000000000000000000000000000000000000000000000000000031dfaf4d61400000000000000000000000000000000000000000000000004db73254763000000000000000000000000000000000000000000000000000000000000676570b30000000000000000000000000000000000000000000015a000af88436291800000000000000000000000000000000000000000000000159ffede207510fe00000000000000000000000000000000000000000000000015a00601a488297400000000000000000000000000000000000000000000000000000000000000000002c8a690222d41257985869083494cac7642192d549c48a7ea58d27a9feb45d7f3c0b1a372ffbace48bf51bdb3d2a6d8f9d56843de5fd027baf4858441c3258131000000000000000000000000000000000000000000000000000000000000000246e9a441319be6fa824a79686d6435358c62faacfe8feb1dbae83b549a3c11f501e01b4583dbeab57f517dea101b2bdbafa9690e66953fbcc6a8f648c1366a63'
    const attps = new ATTPsSDK({
      reportParser: new AproReportParser(),
    })

    // When
    const report = attps.reportParse(hexData) as PayloadData

    // Then
    expect(report).toEqual({
      reportContext: [
        '0x00067f925361b2ab26a59cc1997a5c064b3eeb4c9c39262caaf616b42d1ad132',
        '0x0000000000000000000000000000000000000000000000000000000002742b13',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      report: {
        feedId: '0x0003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d6489',
        validTimeStamp: 1734614835n,
        observeTimeStamp: 1734614835n,
        nativeFee: 3427299284500n,
        tokenFee: 350000000000000000n,
        expireTimeStamp: 1734701235n,
        midPrice: '102121.2246',
        bidPrice: '102121.0936',
        askPrice: '102121.608',
      },
      rawRs: [
        '0xc8a690222d41257985869083494cac7642192d549c48a7ea58d27a9feb45d7f3',
        '0xc0b1a372ffbace48bf51bdb3d2a6d8f9d56843de5fd027baf4858441c3258131',
      ],
      rawSs: [
        '0x46e9a441319be6fa824a79686d6435358c62faacfe8feb1dbae83b549a3c11f5',
        '0x01e01b4583dbeab57f517dea101b2bdbafa9690e66953fbcc6a8f648c1366a63',
      ],
      rawVs: '0x0001000000000000000000000000000000000000000000000000000000000000',
    })
  })
})
