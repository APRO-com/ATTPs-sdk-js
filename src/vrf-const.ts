import BN from 'bn.js'
import elliptic from 'elliptic'
import { bytesToHash } from './vrf-utils'

const EC = elliptic.ec

const ec = new EC('secp256k1')
const curve = ec.curve

const zero = new BN(0)
const one = new BN(1)
const two = new BN(2)
const three = new BN(3)
const four = new BN(4)
const seven = new BN(7)

const groupOrder = ec.curve.n
const generator = ec.g
const fieldSize = curve.p

const curveOrder = new BN(ec.curve.n)
const eulerCriterionPower = fieldSize.sub(one).div(two)
const sqrtPower = fieldSize.add(one).div(four)
const scalarFromCurveHashPrefix = bytesToHash(two.toArray())
const vrfRandomOutputHashPrefix = bytesToHash(three.toArray())
const hashToCurveHashPrefix = bytesToHash(one.toArray())

// red
const fieldSizeRed = BN.red(fieldSize)
const oneRed = one.toRed(fieldSizeRed)

export {
  curve,
  curveOrder,
  ec,
  eulerCriterionPower,
  fieldSize,
  fieldSizeRed,
  generator,
  groupOrder,
  hashToCurveHashPrefix,
  one,
  oneRed,
  scalarFromCurveHashPrefix,
  seven,
  sqrtPower,
  three,
  two,
  vrfRandomOutputHashPrefix,
  zero,
}
