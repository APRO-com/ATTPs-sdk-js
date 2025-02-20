import { randomUUID } from 'node:crypto'
import vrf from '@/vrf'
import { describe, expect, it } from 'vitest'

describe('vrf', () => {
  it('should generate a request id', async () => {
    // Given
    // When
    const result = await vrf.markVrfRequest('http://127.0.0.1:8713', {
      version: 1,
      targetAgentId: randomUUID(),
      clientSeed: '1234',
      keyHash: '969b0a11b8a56bacf1ac18f219e7e376e7c213b7e7e7e46cc70a5dd086daff2a',
      requestTimestamp: Math.floor(Date.now() / 1000),
      callbackUri: 'http://127.0.0.1:8713/api/vrf/proof',
    })

    // Then
    expect(result.length).toBe(64)
    console.log('request id:', result)
  })

  it('should get vrf provider', async () => {
    // Given
    // When
    const response = await vrf.getVrfProviders('http://127.0.0.1:8713')

    // Then
    expect(response.length).toBeGreaterThan(0)
    console.log('vrf providers:', response)
  })

  it('should query vrf request', async () => {
    // Given
    // When
    const response = await vrf.getVrfRequest('http://127.0.0.1:8713', '1d9f42b83ec5a97a62af0c9eece91592847686117d5f3bf4d35a8b6796b51148')

    // Then
    expect(response.requestId).toBe('1d9f42b83ec5a97a62af0c9eece91592847686117d5f3bf4d35a8b6796b51148')
    console.log('vrf request:', response)
  })

  it('should verify vrf proof', async () => {
    // Given
    const proof = {
      publicX: '4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
      publicY: '385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1',
      gammaX: '514d3c0e04b958722dde4fd07edd4cb0ff8564dec00071f43a183571491dc854',
      gammaY: 'de06c37d5bd2706cdd21b92af8c0c27d27209f9938fb7d6e8a2fd5e0f0851b61',
      c: 'eade17723b6f478e422c59da28f9fec2b3ec5308cbad011a062240db4462c8bd',
      s: 'a64613a6c2c2b8dba9cadcff79a3d6db7c973a03cdb41c8654946bc5af2fa2f0',
      seed: '847bf2c5404da462a157fe569ba535bd6f24e6056c957c975ae5d9ef5e1bfa73',
      output: 'ecdd27817867152f88d58f9480a21ab95b26f6bbf5ff816f86b781865b562f96',
    }

    // When
    const verified = await vrf.verifyProof(proof)

    // Then
    expect(verified).toBeTruthy()
  })
})
