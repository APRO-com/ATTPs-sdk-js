import { isAddress } from 'ethers'
import * as v from 'valibot'
import { isValidUUIDV4, prependHexPrefix, uuidv4 } from '../utils'

function EthAddressSchema(name: string) {
  return v.pipe(
    v.string(`${name} must be a string`),
    v.trim(),
    v.transform(prependHexPrefix),
    v.check(isAddress, `${name} must be a valid ethereum address`),
  )
}

const CreateManagerSchema = v.object({
  rpcUrl: v.pipe(
    v.string('rpcUrl must be a string'),
    v.trim(),
    v.regex(/^https?:\/\/|wss?:\/\//, 'rpcUrl must be a valid url, including http/https/ws/wss'),
  ),
  privateKey: v.pipe(
    v.string('privateKey must a string'),
    v.trim(),
    v.regex(/^[0-9a-f]{64}$/i, 'privateKey must be a valid ethereum private key'),
  ),
  proxyAddress: EthAddressSchema('proxyAddress'),
})

const TransactionOptionsSchema = v.optional(
  v.object({
    nonce: v.optional(
      v.pipe(
        v.number('nonce must be a number'),
        v.integer('nonce must be an integer'),
        v.minValue(0, 'nonce must be greater than or equal to 0'),
      ),
    ),
    gasLimit: v.optional(
      v.pipe(
        v.bigint('gasLimit must be a number'),
        v.minValue(BigInt(0), 'gasLimit must be greater than or equal to 0'),
      ),
    ),
    gasPrice: v.optional(
      v.pipe(
        v.bigint('gasPrice must be a bigint'),
        v.minValue(BigInt(0), 'gasPrice must be greater than or equal to 0'),
      ),
    ),
  }),
  {},
)

const CreateAndRegisterAgentSchema = v.object({
  agentSettings: v.object({
    signers: v.pipe(
      v.array(v.string('signers element must be a string')),
      v.transform(arr => arr.map(prependHexPrefix)),
      v.check(arr => arr.every(isAddress), 'signers elements must be valid ethereum addresses'),
    ),
    threshold: v.pipe(
      v.number('threshold must be a number'),
      v.integer('threshold must be an integer'),
    ),
    converterAddress: EthAddressSchema('converterAddress'),
    agentHeader: v.object({
      version: v.optional(
        v.pipe(
          v.string('version must be a string'),
          v.trim(),
        ),
      ),
      messageId: v.optional(
        v.pipe(
          v.string('messageId must be a string'),
          v.trim(),
          v.check(v => isValidUUIDV4(v), 'messageId must be a valid v4 uuid'),
        ),
        () => uuidv4(),
      ),
      sourceAgentId: v.optional(
        v.pipe(
          v.string('messageId must be a string'),
          v.trim(),
          v.check(v => isValidUUIDV4(v), 'sourceAgentId must be a valid v4 uuid'),
        ),
        () => uuidv4(),
      ),
      sourceAgentName: v.pipe(
        v.string('sourceAgentName must be a string'),
        v.trim(),
        v.minLength(1, 'sourceAgentName must be at least 1 character long'),
      ),
      targetAgentId: v.pipe(
        v.string('messageId must be a string'),
        v.trim(),
        v.check(v => isValidUUIDV4(v), 'targetAgentId must be a valid v4 uuid'),
      ),
      timestamp: v.optional(
        v.pipe(
          v.number('timestamp must be a number'),
          v.transform(num => num.toString()),
          v.regex(/^\d{10}$/, 'timestamp must be 10 digits long'),
          v.transform(Number),
        ),
        () => Math.floor(Date.now() / 1000),
      ),
      messageType: v.picklist(
        [0, 1, 2],
        'messageType must be 0 (Request), 1 (Response) or 2 (Event)',
      ),
      priority: v.picklist(
        [0, 1, 2],
        'priority must be 0 (High), 1 (Medium) or 2 (Low)',
      ),
      ttl: v.pipe(
        v.number('ttl must be a number'),
        v.integer('ttl must be an integer'),
        v.minValue(0, 'ttl must be greater than or equal to 0'),
      ),
    }),
  }),
  transactionOptions: TransactionOptionsSchema,
})

const CreateAgentSchema = v.object({
  rpcUrl: v.pipe(
    v.string('rpcUrl must be a string'),
    v.trim(),
    v.regex(/^https?:\/\/|wss?:\/\//, 'rpcUrl must be a valid url, including http/https/ws/wss'),
  ),
  privateKey: v.pipe(
    v.string('privateKey must a string'),
    v.trim(),
    v.regex(/^[0-9a-f]{64}$/i, 'privateKey must be a valid ethereum private key'),
  ),
  proxyAddress: EthAddressSchema('proxyAddress'),
  converterAddress: EthAddressSchema('converterAddress'),
  agent: v.optional(EthAddressSchema('agent')),
  digest: v.optional(
    v.pipe(
      v.string('digest must be a string'),
      v.trim(),
      v.transform(prependHexPrefix),
      v.length(66, 'digest must be 66 characters long, including 0x prefix'),
    ),
  ),
})

const VerifySchema = v.object({
  agent: v.optional(EthAddressSchema('agent')),
  digest: v.optional(
    v.pipe(
      v.string('digest must be a string'),
      v.trim(),
      v.transform(prependHexPrefix),
      v.length(66, 'digest must be 66 characters long, including 0x prefix'),
    ),
  ),
  transactionOptions: TransactionOptionsSchema,
  payload: v.object({
    data: v.pipe(
      v.string('data must be a string'),
      v.trim(),
      v.transform(prependHexPrefix),
      v.minLength(1, 'data must be at least 1 character long'),
    ),
    dataHash: v.optional(
      v.pipe(
        v.string('dataHash must be a string'),
        v.trim(),
        v.transform(prependHexPrefix),
        v.length(66, 'dataHash must be 66 characters long, including 0x prefix'),
      ),
    ),
    signers: v.pipe(
      v.array(v.string('signers element must be a string')),
    ),
    metadata: v.optional(
      v.object({
        contentType: v.optional(
          v.pipe(
            v.string('contentType must be a string'),
            v.trim(),
            v.minLength(1, 'contentType must be at least 1 character long'),
          ),
          'application/abi',
        ),
        encoding: v.optional(
          v.pipe(
            v.string('encoding must be a string'),
            v.trim(),
            v.minLength(1, 'encoding must be at least 1 character long'),
          ),
          'null',
        ),
        compression: v.optional(
          v.pipe(
            v.string('compression must be a string'),
            v.trim(),
            v.minLength(1, 'compression must be at least 1 character long'),
          ),
          'null',
        ),
      }),
      {
        contentType: 'application/abi',
        encoding: 'null',
        compression: 'null',
      },
    ),
  }),
})

export {
  CreateAgentSchema,
  CreateAndRegisterAgentSchema,
  CreateManagerSchema,
  VerifySchema,
}
