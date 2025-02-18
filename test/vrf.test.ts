import { randomUUID } from 'node:crypto'
import { getVrfProviders, getVrfRequest, markVrfRequest } from '@/vrf'
import { describe, expect, it } from 'vitest'

describe('vrf', () => {
  it('should generate a request id', async () => {
    // Given
    // When
    const result = await markVrfRequest('http://127.0.0.1:8713', {
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
    const response = await getVrfProviders('http://127.0.0.1:8713')

    // Then
    expect(response.length).toBeGreaterThan(0)
    console.log('vrf providers:', response)
  })

  it('should query vrf request', async () => {
    // Given
    // When
    const response = await getVrfRequest('http://127.0.0.1:8713', '1d9f42b83ec5a97a62af0c9eece91592847686117d5f3bf4d35a8b6796b51148')

    // Then
    expect(response.requestId).toBe('1d9f42b83ec5a97a62af0c9eece91592847686117d5f3bf4d35a8b6796b51148')
    console.log('vrf request:', response)
  })
})
