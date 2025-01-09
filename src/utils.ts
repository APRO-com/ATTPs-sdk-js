import { randomUUID } from 'node:crypto'
import { AbiCoder } from 'ethers'
import { AiAgentError } from './schema/errors'

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
    throw new AiAgentError(
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

export {
  cleanHexPrefix,
  containsHexPrefix,
  encodeSignatures,
  isValidUUIDV4,
  prependHexPrefix,
  standardizeV,
  uuidv4,
}
