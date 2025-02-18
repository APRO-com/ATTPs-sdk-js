import { generateRequestId } from '@/utils'
import { describe, expect, it } from 'vitest'

describe('utils', () => {
  it('should generate a request id', async () => {
    // Given
    const params = {
      version: 1,
      targetAgentId: '2c7302fd-d3fd-44aa-be38-256b94ae1680',
      clientSeed: '1234',
      requestTimestamp: 1739800571,
      callbackUri: 'http://127.0.0.1:8713/api/vrf/proof',
    }

    // When
    const requestId = await generateRequestId(params)

    // Then
    expect(requestId).toBe('da61c945e38b05fb01c56d10bbbe84cefcc185934927975ede6f8d8048ca2214')
  })
})
