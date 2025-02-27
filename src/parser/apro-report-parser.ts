import type { ReportParser } from '.'
import { AbiCoder, formatUnits, getBytes, hexlify } from 'ethers'

interface PayloadData {
  reportContext: string[]
  report: ReportData
  rawRs: string[]
  rawSs: string[]
  rawVs: string
}

interface ReportData {
  feedId: string
  validTimeStamp: bigint
  observeTimeStamp: bigint
  nativeFee: bigint
  tokenFee: bigint
  expireTimeStamp: bigint
  midPrice: string
  askPrice: string
  bidPrice: string
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
      'uint192', // askPrice
      'uint192', // bidPrice
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
    askPrice: formatUnits(decoded[7], 18),
    bidPrice: formatUnits(decoded[8], 18),
  }
}

export class AproReportParser implements ReportParser<PayloadData> {
  parse = (hexData: string) => {
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

    return {
      reportContext,
      report: parseReportData(report),
      rawRs,
      rawSs,
      rawVs,
    } as PayloadData
  }
}

export type {
  PayloadData,
  ReportData,
}
