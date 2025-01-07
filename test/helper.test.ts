import process from 'node:process'
import { Wallet } from 'ethers'
import { describe, expect, it } from 'vitest'

const isHelperMode = process.env.HELPER_MODE === 'true'

describe('signer generation', () => {
  it.runIf(isHelperMode)('should generate signers', () => {
    // Given
    const signersCount = 5
    const signers = Array.from({ length: signersCount }).map(() => Wallet.createRandom())

    // Then
    expect(signers).toHaveLength(signersCount)

    console.log('signer addresses:', signers.map(signer => signer.address).join(','))
    console.log('signer private keys:', signers.map(signer => signer.privateKey).join(','))
  })
})
