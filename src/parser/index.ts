interface Parser<T> {
  reportParse: (hexData: string) => T
}

export {
  Parser,
}

export * from './apro-parser'
