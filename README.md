# ATTPs SDK

[![License: Apache 2.0][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

The ATTPs SDK is a TypeScript library that provides a set of tools to create ATTPs and verify data integrity.

## Installation

To install the ATTPs SDK, run the following command:

```bash
npm install attps-sdk-js
```

## Usage

### ATTPs Core

To use the ATTPs SDK, import the library and create an instance of the `ATTPsSDK` class:

```typescript
import { ATTPsSDK } from 'attps-sdk-js'

const attps = new ATTPsSDK({
  rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
  privateKey: '',
  proxyAddress: '',
})

// if you want the SDK to hash the data automatically
const attpsWithAutoHash = new ATTPsSDK({
  rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
  privateKey: '',
  proxyAddress: '',
  autoHashData: true,
  converterAddress: '',
})
```

To create a new agent, call the `createAndRegisterAgent` method:

```typescript
import type { AgentSettings, TransactionOptions } from 'attps-sdk-js'
import { randomUUID } from 'node:crypto'
import { parseUnits } from 'ethers'

// prepare the agent settings
const agentSettings: AgentSettings = {
  signers: [],
  threshold: 3,
  converterAddress: '',
  agentHeader: {
    messageId: randomUUID(),
    sourceAgentId: randomUUID(),
    sourceAgentName: 'ATTPs SDK JS',
    targetAgentId: '',
    timestamp: Math.floor(Date.now() / 1000),
    messageType: 0,
    priority: 1,
    ttl: 3600,
  },
}

// prepare the transaction options
const nonce = await attps.getNextNonce()
const transactionOptions: TransactionOptions = {
  nonce,
  gasPrice: parseUnits('1', 'gwei'),
  gasLimit: BigInt(2000000),
}

const tx = await attps.createAndRegisterAgent({ agentSettings, transactionOptions })

// or you can leave the transaction options empty, the SDK will use the auto-generated values
// const tx = await attps.createAndRegisterAgent({ agentSettings })
```

The SDK also provides the tool to extract the new agent address from the transaction receipt:

```typescript
import { parseNewAgentAddress } from 'attps-sdk-js'

const receipt = await tx.wait()
const agentAddress = parseNewAgentAddress(receipt)
```

To verify the data integrity, call the `verify` method:

```typescript
import type { MessagePayload } from 'attps-sdk-js'
import { hexlify, keccak256, toUtf8Bytes } from 'ethers'

// prepare the payload
const data = hexlify(toUtf8Bytes('Hello World!'))
const dataHash = keccak256(data)
const payload: MessagePayload = {
  data,
  dataHash,
  signatures: [
    {
      r: '',
      s: '',
      v: 1, // 1, 0, 27, 28 are allowed
    },
    // ...
  ],
  metadata: {
    contentType: '',
    encoding: '',
    compression: '',
  },
}

const tx = await attps.verify({ payload, agent: '', digest: '' })
```

If the data is obtained from the APRO DATA pull service, you can use the auto-hash feature:

```typescript
import type { MessagePayload } from 'attps-sdk-js'

const payload: MessagePayload = {
  data: '0x...',
  signatures: [
    {
      r: '',
      s: '',
      v: 1, // 1, 0, 27, 28 are allowed
    },
    // ...
  ],
  metadata: {
    contentType: '',
    encoding: '',
    compression: '',
  },
}

// When
const tx = await attpsWithAutoHash.verify({ payload, agent: '', digest: '' })
```

### VRF

ATTPs SDK provides VRF (Verifiable Random Function) capabilities. To use VRF features, you need to specify the VRF backend URL when initializing the SDK:

```typescript
const attps = new ATTPsSDK({
  vrfBackendUrl: 'http://localhost:3000', // Replace with VRF backend URL
})
```

VRF operations include getting providers, making requests, querying requests and verifying proofs:

```typescript
// Get VRF providers
const providers = await attps.getVrfProviders()
// Example response:
// [{
//   address: '0x1234567890123456789012345678901234567890',
//   keyHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
// }]

// Make a VRF request
const requestId = await attps.markVrfRequest({
  version: 1,
  targetAgentId: '',
  clientSeed: '',
  keyHash: '',
  requestTimestamp: Math.floor(Date.now() / 1000),
  callbackUri: 'https://example.com/callback',
})

// Query a VRF request status
const response = await attps.getVrfRequest(requestId)
// Example response will include proof details:
// {
//   requestId: requestId,
//   proof: {
//     publicX: '4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
//     publicY: '385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1',
//     ...
//   }
// }

// Verify a VRF proof
const verified = await attps.verifyProof({
  publicX: '0x4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa', // allowed hex string or base64 string
  publicY: '0x385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1',
  gammaX: '514d3c0e04b958722dde4fd07edd4cb0ff8564dec00071f43a183571491dc854',
  gammaY: 'de06c37d5bd2706cdd21b92af8c0c27d27209f9938fb7d6e8a2fd5e0f0851b61',
  c: 'eade17723b6f478e422c59da28f9fec2b3ec5308cbad011a062240db4462c8bd',
  s: 'a64613a6c2c2b8dba9cadcff79a3d6db7c973a03cdb41c8654946bc5af2fa2f0',
  seed: '847bf2c5404da462a157fe569ba535bd6f24e6056c957c975ae5d9ef5e1bfa73',
  output: 'ecdd27817867152f88d58f9480a21ab95b26f6bbf5ff816f86b781865b562f96',
})
```

For more examples, see the [test](test/index.test.ts) cases.

## License

This project is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0). The full license text can be found in the [LICENSE](LICENSE) file.

Copyright (c) 2025 Apro.

[npm-image]: https://img.shields.io/npm/v/attps-sdk-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/attps-sdk-js
[downloads-image]: https://img.shields.io/npm/dm/attps-sdk-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/attps-sdk-js
[license-image]: https://img.shields.io/npm/l/attps-sdk-js.svg?style=flat-square
[license-url]: https://npmjs.org/package/attps-sdk-js
