import { Wallet } from 'ethers'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

async function randomSigners(count: number) {
  return Array.from({ length: count }, () => Wallet.createRandom().address)
}

const server = setupServer(
  http.get('*/api/vrf/provider', () => {
    return HttpResponse.json({
      message: 'success',
      code: 0,
      result: [
        {
          address: '0x1234567890123456789012345678901234567890',
          keyHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        },
      ],
      responseEnum: 'SUCCESS',
    })
  }),
  http.post('*/api/vrf/request', () => {
    return HttpResponse.json({
      message: 'success',
      code: 0,
      result: '0x9876543210987654321098765432109876543210',
      responseEnum: 'SUCCESS',
    })
  }),
  http.get('*/api/vrf/query', () => {
    return HttpResponse.json({
      message: 'success',
      code: 0,
      result: {
        requestId: '0x9876543210987654321098765432109876543210',
        proof: {
          publicX: '4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
          publicY: '385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1',
          gammaX: '514d3c0e04b958722dde4fd07edd4cb0ff8564dec00071f43a183571491dc854',
          gammaY: 'de06c37d5bd2706cdd21b92af8c0c27d27209f9938fb7d6e8a2fd5e0f0851b61',
          c: 'eade17723b6f478e422c59da28f9fec2b3ec5308cbad011a062240db4462c8bd',
          s: 'a64613a6c2c2b8dba9cadcff79a3d6db7c973a03cdb41c8654946bc5af2fa2f0',
          seed: '847bf2c5404da462a157fe569ba535bd6f24e6056c957c975ae5d9ef5e1bfa73',
          output: 'ecdd27817867152f88d58f9480a21ab95b26f6bbf5ff816f86b781865b562f96',
        },
      },
      responseEnum: 'SUCCESS',
    })
  }),
)

export {
  randomSigners,
  server,
}
