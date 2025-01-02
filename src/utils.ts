function containsHexPrefix(value: string): boolean {
  return value?.startsWith('0x')
}

function prependHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value : `0x${value}`
}

function cleanHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value.slice(2) : value
}

export {
  cleanHexPrefix,
  containsHexPrefix,
  prependHexPrefix,
}
