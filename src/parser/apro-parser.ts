import type { Parser } from '.'
import { AbiCoder, formatUnits, getBytes, hexlify } from 'ethers'

interface Signature {
  r: string
  s: string
  v: number
}

interface PayloadData {
  reportContext: string[]
  report: ReportData
  signatures: Signature[]
}

interface ReportData {
  feedId: string
  validTimeStamp: bigint
  observeTimeStamp: bigint
  nativeFee: bigint
  tokenFee: bigint
  expireTimeStamp: bigint
  midPrice: string
  bidPrice: string
  askPrice: string
}

const abiCoder = AbiCoder.defaultAbiCoder()

function parseReportData(report: Uint8Array): ReportData {
  const hexReport = hexlify(report)
  const decoded = abiCoder.decode(
    [
      'bytes32', // feedId
      'uint32', // validTimeStamp
      'uint32', // observeTimeStamp
      'uint192', // nativeFee
      'uint192', // tokenFee
      'uint32', // expireTimeStamp
      'uint192', // midPrice
      'uint192', // bidPrice
      'uint192', // askPrice
    ],
    hexReport,
  )

  return {
    feedId: decoded[0],
    validTimeStamp: decoded[1],
    observeTimeStamp: decoded[2],
    nativeFee: decoded[3],
    tokenFee: decoded[4],
    expireTimeStamp: decoded[5],
    midPrice: formatUnits(decoded[6], 18),
    bidPrice: formatUnits(decoded[7], 18),
    askPrice: formatUnits(decoded[8], 18),
  }
}

export class AproParser implements Parser<PayloadData> {
  reportParse = (hexData: string) => {
    const decoded = abiCoder.decode(
      [
        'bytes32[3]', // reportContext
        'bytes', // report
        'bytes32[]', // rawRs
        'bytes32[]', // rawSs
        'bytes32', // rawVs
      ],
      hexData,
    )

    const reportContext = decoded[0].map((r: string) => r)
    const report = getBytes(decoded[1])
    const rawRs = decoded[2].map((r: string) => r)
    const rawSs = decoded[3].map((s: string) => s)
    const rawVs = decoded[4]

    const vsBytes = getBytes(rawVs)
    const signatures: Signature[] = []
    for (let i = 0; i < Math.min(rawRs.length, rawSs.length); i++) {
      signatures.push({
        r: rawRs[i],
        s: rawSs[i],
        v: i < vsBytes.length ? vsBytes[i] : 0,
      })
    }

    return {
      reportContext,
      report: parseReportData(report),
      signatures,
    } as PayloadData
  }
}

export type {
  PayloadData,
  ReportData,
  Signature,
}
