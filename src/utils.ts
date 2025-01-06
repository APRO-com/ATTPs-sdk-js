import { randomUUID } from 'node:crypto'
import { getAddress } from 'ethers'

function containsHexPrefix(value: string): boolean {
  return value?.startsWith('0x')
}

function prependHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value : `0x${value}`
}

function cleanHexPrefix(value: string): string {
  return containsHexPrefix(value) ? value.slice(2) : value
}

function uuidv4(): string {
  return randomUUID()
}

function isValidUUIDV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function validateAndNormalizeAddress(address: string):
  { isValid: true, normalizedAddress: string, error: null } |
  { isValid: false, normalizedAddress: null, error: string } {
  try {
    const normalizedAddress = getAddress(address)
    return {
      isValid: true,
      normalizedAddress,
      error: null,
    }
  }
  catch (error: any) {
    return {
      isValid: false,
      normalizedAddress: null,
      error: error.message,
    }
  }
}

export {
  cleanHexPrefix,
  containsHexPrefix,
  isValidUUIDV4,
  prependHexPrefix,
  uuidv4,
  validateAndNormalizeAddress,
}
