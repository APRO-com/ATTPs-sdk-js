import type * as v from 'valibot'
import type { VrfRequestSchema } from './schema/validator'
import { ATTPsError } from './schema/errors'
import { generateRequestId, joinURL } from './utils'

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

export {
  getVrfProviders,
  getVrfRequest,
  markVrfRequest,
}
