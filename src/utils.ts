import type { ContractTransactionReceipt } from 'ethers'
import { randomUUID } from 'node:crypto'
import { posix } from 'node:path'
import { AbiCoder, concat, getBytes, keccak256, stripZerosLeft, toUtf8Bytes } from 'ethers'
import { AgentRegisteredTopic } from './schema/abi'
import { ATTPsError } from './schema/errors'

function containsHexPrefix(value: string): boolean {
  return value?.startsWith('0x')
}

function prependHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value : `0x${value}`
}

function cleanHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value.slice(2) : value
}

function uuidv4(): string {
  return randomUUID()
}

function isValidUUIDV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function encodeSignatures(signatures: { r: string, s: string, v: number }[]): string {
  try {
    const rs = signatures.map(sig => sig.r)
    const ss = signatures.map(sig => sig.s)
    const vs = signatures.map(sig => sig.v)

    const abiCoder = AbiCoder.defaultAbiCoder()
    return abiCoder.encode(
      ['bytes32[]', 'bytes32[]', 'uint8[]'],
      [rs, ss, vs],
    )
  }
  catch (e: any) {
    throw new ATTPsError(
      'PARAMETER_ERROR',
      `Failed to encode signatures, make sure to provide valid signatures, error: ${e.message}`,
    )
  }
}

function standardizeV(v: 1 | 0 | 27 | 28) {
  if (v === 27 || v === 28) {
    return v - 27
  }
  return v
}

function parseNewAgentAddress(receipt: ContractTransactionReceipt | null) {
  if (!receipt) {
    throw new ATTPsError('PARAMETER_ERROR', 'Invalid transaction receipt')
  }

  return receipt.logs
    .filter(log => log.topics[0] === AgentRegisteredTopic)
    .map(log => log.topics[1])
    .map(address => stripZerosLeft(address))
    .at(0)
}

function toBytes8(num: number) {
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setBigUint64(0, BigInt(num), false) // false表示大端序
  return new Uint8Array(buffer)
}

async function generateRequestId(vrfRequest: {
  version: number
  targetAgentId: string
  clientSeed: string
  requestTimestamp: number
  callbackUri: string
}) {
  const parts = [
    toBytes8(vrfRequest.version),
    toUtf8Bytes(vrfRequest.targetAgentId),
    getBytes(prependHexPrefix(vrfRequest.clientSeed)),
    toBytes8(vrfRequest.requestTimestamp),
    toUtf8Bytes(vrfRequest.callbackUri),
  ]

  const concatenated = concat(parts)
  return keccak256(concatenated).slice(2)
}

function joinURL(baseURL: string, ...paths: string[]): string {
  const url = new URL(baseURL)
  url.pathname = posix.join(url.pathname, ...paths)
  return url.toString()
}

export {
  cleanHexPrefix,
  containsHexPrefix,
  encodeSignatures,
  generateRequestId,
  isValidUUIDV4,
  joinURL,
  parseNewAgentAddress,
  prependHexPrefix,
  standardizeV,
  uuidv4,
}
