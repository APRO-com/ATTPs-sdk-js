# ATTPs SDK

The ATTPs SDK is a TypeScript library that provides a set of tools to create AI agents and verify data integrity.

## Installation

To install the ATTPs SDK, run the following command:

```bash
npm install attps-sdk-js
```

## Usage

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

For more examples, see the [test](test/index.test.ts) cases.

## License

This project is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0). The full license text can be found in the [LICENSE](LICENSE) file.

Copyright (c) 2025 Apro.
