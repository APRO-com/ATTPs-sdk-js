import type { ContractTransactionResponse, Provider } from 'ethers'
import type { ActualATTPsSDKProps, ATTPsSDKProps, CreateAndRegisterAgentParams, VerifyParams, VrfProof, VrfRequest } from './schema/validator'
import { Contract, getDefaultProvider, keccak256, Wallet } from 'ethers'
import * as v from 'valibot'
import { agentManagerAbi, agentProxyAbi, converterAbi } from './schema/abi'
import { ATTPsError } from './schema/errors'
import { ATTPsSDKPropsSchema, CreateAndRegisterAgentSchema, VerifySchema, VrfProofSchema, VrfRequestSchema } from './schema/validator'
import { encodeSignatures } from './utils'
import vrf from './vrf'

interface FullAgentSettings {
  signers: string[]
  threshold: number
  converterAddress: string
  agentHeader: {
    version?: string
    messageId: string
    sourceAgentId: string
    sourceAgentName: string
    targetAgentId: string
    timestamp: number
    messageType: number
    priority: number
    ttl: number
  }
}

class ATTPsSDK {
  private autoHashData: boolean
  private wallet?: Wallet
  private provider?: Provider
  private proxyContract?: Contract
  private converterContract?: Contract
  private managerContract?: Contract
  private vrfBackendUrl?: string = 'http://127.0.0.1:8713'

  private props: ActualATTPsSDKProps

  constructor(props: ATTPsSDKProps) {
    const p = v.safeParse(ATTPsSDKPropsSchema, props)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    this.props = p.output
    const { rpcUrl, privateKey, proxyAddress, converterAddress, autoHashData, vrfBackendUrl } = this.props
    this.autoHashData = autoHashData

    if (vrfBackendUrl) {
      this.vrfBackendUrl = vrfBackendUrl
    }

    if (rpcUrl && privateKey) {
      const provider = getDefaultProvider(rpcUrl)
      const wallet = new Wallet(privateKey, provider)
      this.wallet = wallet
      this.provider = provider

      if (proxyAddress) {
        this.proxyContract = new Contract(proxyAddress, agentProxyAbi, wallet)
      }
      if (converterAddress) {
        this.converterContract = new Contract(converterAddress, converterAbi, wallet)
      }
    }
  }

  private getErrorIfPropMissing = () => {
    if (!this.props.proxyAddress) {
      return new ATTPsError('PARAMETER_ERROR', 'proxyAddress is required')
    }
    if (!this.props.rpcUrl) {
      return new ATTPsError('PARAMETER_ERROR', 'rpcUrl is required')
    }
    if (!this.props.privateKey) {
      return new ATTPsError('PARAMETER_ERROR', 'privateKey is required')
    }
  }

  public createAndRegisterAgent = async (params: CreateAndRegisterAgentParams): Promise<ContractTransactionResponse> => {
    if (!this.proxyContract) {
      throw this.getErrorIfPropMissing()
    }

    const p = v.safeParse(CreateAndRegisterAgentSchema, params)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    const { agentSettings, transactionOptions } = p.output
    const { agentHeader } = agentSettings as FullAgentSettings
    const managerContract = await this.getManagerContract()
    agentHeader.version = await managerContract.agentVersion()

    if (!await managerContract.isValidSourceAgentId(agentHeader.sourceAgentId)) {
      throw new ATTPsError('PARAMETER_ERROR', 'Invalid source agent id, please provide a new one')
    }

    return await this.proxyContract.createAndRegisterAgent(agentSettings, transactionOptions)
  }

  public verify = async (params: VerifyParams): Promise<ContractTransactionResponse> => {
    if (!this.proxyContract) {
      throw this.getErrorIfPropMissing()
    }

    const p = v.safeParse(VerifySchema, params)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    const { payload, agent, digest, transactionOptions } = p.output
    if (this.autoHashData) {
      payload.dataHash = keccak256(await this.converter(payload.data))
    }
    if (!payload.dataHash) {
      throw new ATTPsError('PARAMETER_ERROR', 'dataHash is required')
    }

    const signatureProof = encodeSignatures(payload.signatures)
    return await this.proxyContract.verify(agent, digest, {
      data: payload.data,
      dataHash: payload.dataHash,
      proofs: {
        zkProof: '0x',
        merkleProof: '0x',
        signatureProof,
      },
      metadata: payload.metadata,
    }, transactionOptions)
  }

  public markVrfRequest = async (vrfRequest: VrfRequest) => {
    if (!this.vrfBackendUrl) {
      throw new ATTPsError('PARAMETER_ERROR', 'VRF backend url is required')
    }

    const p = v.safeParse(VrfRequestSchema, vrfRequest)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    return vrf.markVrfRequest(this.vrfBackendUrl, p.output)
  }

  public getVrfProviders = async () => {
    if (!this.vrfBackendUrl) {
      throw new ATTPsError('PARAMETER_ERROR', 'VRF backend url is required')
    }

    return vrf.getVrfProviders(this.vrfBackendUrl)
  }

  public getVrfRequest = async (requestId: string) => {
    if (!this.vrfBackendUrl) {
      throw new ATTPsError('PARAMETER_ERROR', 'VRF backend url is required')
    }

    return vrf.getVrfRequest(this.vrfBackendUrl, requestId)
  }

  public getNextNonce = async () => {
    if (!this.wallet) {
      throw this.getErrorIfPropMissing()
    }
    return this.wallet.getNonce()
  }

  public verifyProof = async (proof: VrfProof) => {
    const p = v.safeParse(VrfProofSchema, proof)
    if (!p.success) {
      throw new ATTPsError('PARAMETER_ERROR', p.issues.map(i => i.message).join('; '))
    }

    return vrf.verifyProof(p.output)
  }

  private converter = async (data: string) => {
    return await this.converterContract!.converter(data)
  }

  private getManagerContract = async () => {
    if (!this.proxyContract) {
      throw this.getErrorIfPropMissing()
    }
    if (this.managerContract) {
      return this.managerContract
    }

    const managerAddress = await this.proxyContract.agentManager()
    this.managerContract = new Contract(managerAddress, agentManagerAbi, this.provider)
    return this.managerContract
  }
}

export {
  ATTPsSDK,
}
