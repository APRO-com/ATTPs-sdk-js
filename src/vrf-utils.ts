import { Buffer } from 'node:buffer'
import BN from 'bn.js'
import { concat, getBytes, keccak256, toUtf8Bytes } from 'ethers'
import { ATTPsError } from './schema/errors'
import { prependHexPrefix } from './utils'
import { curve, curveOrder, ec, eulerCriterionPower, fieldSize, fieldSizeRed, groupOrder, hashToCurveHashPrefix, one, oneRed, scalarFromCurveHashPrefix, seven, sqrtPower, three, two, zero } from './vrf-const'

const HASH_LENGTH = 32

function uint256ToBytes32(uint256: BN) {
  if (uint256.byteLength() > HASH_LENGTH) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'vrf.uint256ToBytes32: too big to marshal to uint256')
  }
  return leftPadBytes(uint256.toArray(), HASH_LENGTH)
}

function leftPadBytes(slice: any, length: number) {
  if (slice.length >= length) {
    return Buffer.from(slice)
  }
  const newSlice = Buffer.alloc(length, 0)
  Buffer.from(slice).copy(newSlice, length - slice.length)
  return newSlice
}

function bytesToHash(buffer: Buffer | number[] | Uint8Array): Buffer {
  const bufferData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

  const hash = Buffer.alloc(HASH_LENGTH)

  if (bufferData.length > HASH_LENGTH) {
    bufferData.copy(hash, 0, bufferData.length - HASH_LENGTH)
  }
  else {
    bufferData.copy(hash, HASH_LENGTH - bufferData.length)
  }

  return hash
}

function longMarshal(point: any) {
  const x = leftPadBytes(point.getX().toArray(), 32)
  const y = leftPadBytes(point.getY().toArray(), 32)
  return Buffer.concat([x, y])
}

function fieldHash(message: Buffer) {
  let hashResult = mustHash(message)
  let rv = new BN(bytesToHash(hashResult))

  while (rv.gte(fieldSize)) {
    const shortRV = bytesToHash(Buffer.from(rv.toArray()))
    hashResult = mustHash(shortRV)
    rv = new BN(bytesToHash(hashResult))
  }
  return rv
}

function ySquare(x: BN) {
  return x.pow(three).mod(fieldSize).add(seven).mod(fieldSize)
}

function isSquare(x: BN) {
  const xRed = x.toRed(fieldSizeRed)
  return xRed.redPow(eulerCriterionPower).eq(oneRed)
}

function squareRoot(x: BN) {
  const xRed = x.toRed(fieldSizeRed)
  return xRed.redPow(sqrtPower).fromRed()
}

function isCurveXOrdinate(x: BN) {
  return isSquare(ySquare(x))
}

function hashToCurve(point: any, seed: BN) {
  if (!(seed.byteLength() <= 256 && seed.gte(zero))) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'bad input to vrf.HashToCurve')
  }
  const inputTo32Byte = uint256ToBytes32(seed)

  const merged = Buffer.concat([
    hashToCurveHashPrefix,
    longMarshal(point),
    inputTo32Byte,
  ])

  let x = fieldHash(merged)
  while (!isCurveXOrdinate(x)) {
    x = fieldHash(bytesToHash(Buffer.from(x.toArray())))
  }

  const y_2 = ySquare(x)
  const y = squareRoot(y_2)

  const result = curve.point(x, y)
  if (!curve.validate(result)) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'point requested from invalid coordinates')
  }

  if (y.mod(two).eq(one)) {
    return result.neg()
  }

  return result
}

function checkCGammaNotEqualToSHash(c: BN, gammaPoint: any, s: BN, hashPoint: any) {
  const groupOrder = new BN(curve.n)

  const gamma = ec.keyFromPublic(gammaPoint, 'hex').getPublic()
  const hash = ec.keyFromPublic(hashPoint, 'hex').getPublic()

  const p1 = gamma.mul(c.umod(groupOrder))
  const p2 = hash.mul(s.umod(groupOrder))

  return !(p1.eq(p2))
}

function linearCombination(c: BN, p1: any, s: BN, p2: any) {
  const scalarMul1 = p1.mul(c.umod(curveOrder))
  const scalarMul2 = p2.mul(s.umod(curveOrder))

  return scalarMul1.add(scalarMul2)
}

function getLast160BitOfPoint(point: any) {
  const sha3Result = mustHash(longMarshal(point))
  return sha3Result.subarray(12, 32)
}

function scalarFromCurvePoints(hash: any, pk: any, gamma: any, uWitness: Buffer, v: any) {
  const merged = Buffer.concat([
    Buffer.from(scalarFromCurveHashPrefix),
    longMarshal(hash),
    longMarshal(pk),
    longMarshal(gamma),
    longMarshal(v),
    uWitness,
  ])

  return new BN(mustHash(merged))
}

function mustHash(message: Buffer) {
  return Buffer.from(keccak256(message).slice(2), 'hex')
}

function wellFormed(publicKey: any, gamma: any, C: BN, S: BN, output: BN) {
  if (!curve.validate(publicKey)) {
    return false
  }
  if (!curve.validate(gamma)) {
    return false
  }
  if (C.cmp(groupOrder) >= 0) {
    return false
  }
  if (S.cmp(groupOrder) >= 0) {
    return false
  }
  if (!(output.toArray('be').length <= HASH_LENGTH)) {
    return false
  }
  return true
}

function toBytes8(num: number) {
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setBigUint64(0, BigInt(num), false)
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

export {
  bytesToHash,
  checkCGammaNotEqualToSHash,
  generateRequestId,
  getLast160BitOfPoint,
  hashToCurve,
  linearCombination,
  longMarshal,
  mustHash,
  scalarFromCurvePoints,
  wellFormed,
}
