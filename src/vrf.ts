import type * as v from 'valibot'
import type { VrfRequestSchema } from './schema/validator'
import { Buffer } from 'node:buffer'
import BN from 'bn.js'
import { ATTPsError } from './schema/errors'
import { generateRequestId, joinURL } from './utils'
import { curve, generator, vrfRandomOutputHashPrefix } from './vrf-const'
import { checkCGammaNotEqualToSHash, getLast160BitOfPoint, hashToCurve, linearCombination, longMarshal, mustHash, scalarFromCurvePoints, wellFormed } from './vrf-utils'

type VrfRequestInput = v.InferOutput<typeof VrfRequestSchema>

interface VrfResponse<T> {
  message: string
  code: number
  result: T
  responseEnum: string
}

interface VrfProvider {
  address: string
  keyHash: string
}

interface Vrf {
  requestId: string
  proof: {
    publicX: string
    publicY: string
    gammaX: string
    gammaY: string
    c: string
    s: string
    seed: string
    output: string
  }
}

type Proof = Vrf['proof']

function getResponseOrThrow<T>(response: VrfResponse<T>): T {
  if (response.code !== 0) {
    throw new ATTPsError('VRF_REQUEST_ERROR', response.message)
  }
  return response.result
}

async function markVrfRequest(vrfBackendUrl: string, vrfRequest: VrfRequestInput) {
  const body = {
    version: vrfRequest.version,
    target_agent_id: vrfRequest.targetAgentId,
    client_seed: vrfRequest.clientSeed,
    key_hash: vrfRequest.keyHash,
    request_timestamp: vrfRequest.requestTimestamp,
    request_id: await generateRequestId({
      version: vrfRequest.version,
      targetAgentId: vrfRequest.targetAgentId,
      clientSeed: vrfRequest.clientSeed,
      requestTimestamp: vrfRequest.requestTimestamp,
      callbackUri: vrfRequest.callbackUri,
    }),
    callback_uri: vrfRequest.callbackUri,
  }

  const url = joinURL(vrfBackendUrl, '/api/vrf/request')
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = await response.json() as VrfResponse<string>
  return getResponseOrThrow(json)
}

async function getVrfProviders(vrfBackendUrl: string) {
  const url = joinURL(vrfBackendUrl, '/api/vrf/provider')
  const response = await fetch(url, {
    method: 'GET',
  })

  const json = await response.json() as VrfResponse<VrfProvider[]>
  return getResponseOrThrow(json)
}

async function getVrfRequest(vrfBackendUrl: string, requestId: string) {
  const url = joinURL(vrfBackendUrl, '/api/vrf/query')
  const response = await fetch(`${url}?request_id=${requestId}`)

  const json = await response.json() as VrfResponse<Vrf>
  return getResponseOrThrow(json)
}

async function verifyProof(proof: Proof) {
  const pubKey = curve.point(proof.publicX, proof.publicY)
  const gamma = curve.point(proof.gammaX, proof.gammaY)
  const C = new BN(proof.c, 16)
  const S = new BN(proof.s, 16)
  const seed = new BN(proof.seed, 16)
  const outputBN = new BN(proof.output, 16)

  if (!wellFormed(pubKey, gamma, C, S, outputBN)) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'badly-formatted proof')
  }

  const h = hashToCurve(pubKey, seed)
  if (!checkCGammaNotEqualToSHash(C, gamma, S, h)) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'c*y = s*hash (disallowed in solidity verifier)')
  }

  const uPrime = linearCombination(C, pubKey, S, generator)
  const vPrime = linearCombination(C, gamma, S, h)

  const uWitness = getLast160BitOfPoint(uPrime)

  const cPrime = scalarFromCurvePoints(h, pubKey, gamma, uWitness, vPrime)
  const gammaRepresent = longMarshal(gamma)

  const prefixAndGamma = Buffer.concat([vrfRandomOutputHashPrefix, gammaRepresent])
  const output = mustHash(prefixAndGamma)

  if (!(C.cmp(cPrime) === 0)) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'C != cPrime')
  }
  if (!(outputBN.cmp(new BN(output)) === 0)) {
    throw new ATTPsError('VRF_PROOF_ERROR', 'output != output')
  }
  return true
}

export default {
  getVrfProviders,
  getVrfRequest,
  markVrfRequest,
  verifyProof,
}

export type {
  Vrf,
  VrfProvider,
}
