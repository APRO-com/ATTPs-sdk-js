import { Wallet } from 'ethers'

async function randomSigners(count: number) {
  return Array.from({ length: count }, () => Wallet.createRandom().address)
}

export {
  randomSigners,
}
