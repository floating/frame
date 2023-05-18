import { addHexPrefix } from '@ethereumjs/util'
import log from 'electron-log'

import GasMonitor from './monitor'
import { Block, createGasCalculator } from './calculator'
import { Provider } from '../provider'

// These chain IDs are known to not support EIP-1559 and will be forced
// not to use that mechanism
// TODO: create a more general chain config that can use the block number
// and ethereumjs/common to determine the state of various EIPs
// Note that Arbitrum is in the list because it does not currently charge priority fees
// https://support.arbitrum.io/hc/en-us/articles/4415963644955-How-the-fees-are-calculated-on-Arbitrum
const legacyChains = [250, 4002, 42161]

export const eip1559Allowed = (chainId: string) => !legacyChains.includes(parseInt(chainId))

export async function getGas(provider: Provider, chainId: string, block: Block) {
  let feeMarket = null

  const gasMonitor = new GasMonitor(provider)

  if (eip1559Allowed(chainId) && 'baseFeePerGas' in block) {
    try {
      // only consider this an EIP-1559 block if fee market can be loaded
      const feeHistory = await gasMonitor.getFeeHistory(10, [10])
      const gasCalculator = createGasCalculator(parseInt(chainId))
      feeMarket = gasCalculator.calculateGas(feeHistory)
    } catch (e) {
      feeMarket = null
      // log.error(`could not load EIP-1559 fee market for chain ${this.chainId}`, e)
    }
  }

  let gasPrice

  try {
    if (feeMarket) {
      // TODO: bignum
      const gasPriceInt = parseInt(feeMarket.maxBaseFeePerGas) + parseInt(feeMarket.maxPriorityFeePerGas)
      gasPrice = { fast: addHexPrefix(gasPriceInt.toString(16)) }
    } else {
      gasPrice = await gasMonitor.getGasPrices()
    }
  } catch (e) {
    log.error(`could not fetch gas prices for chain ${chainId}`, { feeMarket }, e)
  }

  return { gasPrice, feeMarket }
}
