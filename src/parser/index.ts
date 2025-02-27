interface ReportParser<T> {
  parse: (hexData: string) => T
}

export {
  ReportParser,
}

export * from './apro-report-parser'
