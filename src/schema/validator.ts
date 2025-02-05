import { isAddress, isBytesLike } from 'ethers'
import * as v from 'valibot'
import { cleanHexPrefix, isValidUUIDV4, prependHexPrefix, standardizeV, uuidv4 } from '../utils'

function ethAddressSchema(name: string) {
  return v.pipe(
    v.string(`${name} must be a string`),
    v.trim(),
    v.transform(prependHexPrefix),
    v.check<string, string>(isAddress, `${name} must be a valid ethereum address`),
  )
}

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
        v.bigint('gasLimit must be a bigint'),
        v.minValue(BigInt(0), 'gasLimit must be greater than or equal to 0'),
      ),
    ),
    gasPrice: v.optional(
      v.pipe(
        v.bigint('gasPrice must be a bigint'),
        v.minValue(BigInt(0), 'gasPrice must be greater than or equal to 0'),
      ),
    ),
  }, 'transactionOptions must be an object'),
  {},
)

const AgentSDKPropsSchema = v.pipe(
  v.object({
    rpcUrl: v.pipe(
      v.string('rpcUrl must be a string'),
      v.trim(),
      v.regex(/^https?:\/\/|wss?:\/\//, 'rpcUrl must be a valid url, including http/https/ws/wss'),
    ),
    privateKey: v.pipe(
      v.string('privateKey must a string'),
      v.trim(),
      v.transform(cleanHexPrefix),
      v.regex(/^[0-9a-f]{64}$/i, 'privateKey must be a valid ethereum private key'),
    ),
    proxyAddress: ethAddressSchema('proxyAddress'),
    converterAddress: v.optional(ethAddressSchema('converterAddress')),
    autoHashData: v.optional(
      v.boolean('autoHashData must be a boolean'),
      false,
    ),
  }, 'agentSDKProps must be an object'),
  v.forward(
    v.partialCheck(
      [['converterAddress'], ['autoHashData']],
      ({ converterAddress, autoHashData }) => !(autoHashData && !converterAddress),
      'converterAddress must be provided if autoHashData is enabled',
    ),
    ['converterAddress'],
  ),
)

const AgentSettingsSchema = v.object({
  signers: v.pipe(
    v.array(v.string('signers element must be a string'), 'signers must be an array of strings'),
    v.transform(arr => arr.map(prependHexPrefix)),
    v.check(arr => arr.every(isAddress), 'signers elements must be valid ethereum addresses'),
    v.minLength(1, 'signers must have at least 1 element'),
  ),
  threshold: v.pipe(
    v.number('threshold must be a number'),
    v.integer('threshold must be an integer'),
  ),
  converterAddress: ethAddressSchema('converterAddress'),
  agentHeader: v.object({
    messageId: v.nullish(
      v.pipe(
        v.string('messageId must be a string'),
        v.trim(),
        v.check(v => isValidUUIDV4(v), 'messageId must be a valid v4 uuid'),
      ),
      () => uuidv4(),
    ),
    sourceAgentId: v.nullish(
      v.pipe(
        v.string('sourceAgentId must be a string'),
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
      v.string('targetAgentId must be a string'),
      v.trim(),
      v.check(v => isValidUUIDV4(v), 'targetAgentId must be a valid v4 uuid'),
    ),
    timestamp: v.nullish(
      v.pipe(
        v.number('timestamp must be a number'),
        v.transform(num => num.toString()),
        v.regex(/^\d{10}$/, 'timestamp must be 10 digits long'),
        v.transform(Number),
      ),
      () => Math.floor(Date.now() / 1000),
    ),
    messageType: v.union(
      [
        v.literal(0),
        v.literal(1),
        v.literal(2),
      ],
      'messageType must be 0 (Request), 1 (Response) or 2 (Event)',
    ),
    priority: v.union(
      [
        v.literal(0),
        v.literal(1),
        v.literal(2),
      ],
      'priority must be 0 (High), 1 (Medium) or 2 (Low)',
    ),
    ttl: v.pipe(
      v.number('ttl must be a number'),
      v.integer('ttl must be an integer'),
      v.minValue(0, 'ttl must be greater than or equal to 0'),
    ),
  }, 'agentHeader must be an object'),
}, 'agentSettings must be an object')

const CreateAndRegisterAgentSchema = v.object({
  agentSettings: AgentSettingsSchema,
  transactionOptions: TransactionOptionsSchema,
}, 'createAndRegisterAgentParams must be an object')

const SignatureSchema = v.pipe(
  v.array(
    v.object({
      r: v.pipe(
        v.string('r must be a string'),
        v.trim(),
        v.transform(prependHexPrefix),
        v.length(66, 'r must be 66 characters long, including 0x prefix'),
      ),
      s: v.pipe(
        v.string('s must be a string'),
        v.trim(),
        v.transform(prependHexPrefix),
        v.length(66, 's must be 66 characters long, including 0x prefix'),
      ),
      v: v.pipe(
        v.union([
          v.literal(0),
          v.literal(1),
          v.literal(27),
          v.literal(28),
        ], 'v must be 0, 1, 27 or 28'),
        v.transform(standardizeV),
      ),
    }, 'signatures elements must be objects that include r, s, and v.'),
    'signatures must be an array of objects',
  ),
  v.minLength(1, 'signatures must have at least 1 element'),
)

const MetaDataSchema = v.nullish(
  v.object({
    contentType: v.nullish(
      v.pipe(
        v.string('contentType must be a string'),
        v.trim(),
      ),
      '',
    ),
    encoding: v.nullish(
      v.pipe(
        v.string('encoding must be a string'),
        v.trim(),
      ),
      '',
    ),
    compression: v.nullish(
      v.pipe(
        v.string('compression must be a string'),
        v.trim(),
      ),
      '',
    ),
  }, 'metadata must be an object'),
  {
    contentType: '',
    encoding: '',
    compression: '',
  },
)

const MessagePayloadSchema = v.object({
  data: v.pipe(
    v.string('data must be a string'),
    v.trim(),
    v.transform(prependHexPrefix),
    v.minLength(1, 'data must be at least 1 character long'),
    v.check(isBytesLike, 'data must be a valid bytes-like string'),
  ),
  dataHash: v.nullish(
    v.pipe(
      v.string('dataHash must be a string'),
      v.trim(),
      v.transform(prependHexPrefix),
      v.length(66, 'dataHash must be 66 characters long, including 0x prefix'),
      v.check(isBytesLike, 'dataHash must be a valid bytes-like string'),
    ),
  ),
  signatures: SignatureSchema,
  metadata: MetaDataSchema,
}, 'payload must be an object')

const VerifySchema = v.object({
  agent: ethAddressSchema('agent'),
  digest: v.pipe(
    v.string('digest must be a string'),
    v.trim(),
    v.transform(prependHexPrefix),
    v.length(66, 'digest must be 66 characters long, including 0x prefix'),
  ),
  transactionOptions: TransactionOptionsSchema,
  payload: MessagePayloadSchema,
}, 'verifyParams must be an object')

type MessagePayload = v.InferInput<typeof MessagePayloadSchema>
type TransactionOptions = v.InferInput<typeof TransactionOptionsSchema>
type VerifyParams = v.InferInput<typeof VerifySchema>
type CreateAndRegisterAgentParams = v.InferInput<typeof CreateAndRegisterAgentSchema>
type AgentSettings = v.InferInput<typeof AgentSettingsSchema>
type Signature = v.InferInput<typeof SignatureSchema>
type AgentSDKProps = v.InferInput<typeof AgentSDKPropsSchema>
type MetaData = v.InferInput<typeof MetaDataSchema>

export {
  AgentSDKPropsSchema,
  CreateAndRegisterAgentSchema,
  VerifySchema,
}

export type {
  AgentSDKProps,
  AgentSettings,
  CreateAndRegisterAgentParams,
  MessagePayload,
  MetaData,
  Signature,
  TransactionOptions,
  VerifyParams,
}
