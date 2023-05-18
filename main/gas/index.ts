import { addHexPrefix } from '@ethereumjs/util'
import log from 'electron-log'

import { Block, createGasCalculator } from './calculator'
import { Provider } from '../provider'
import { intToHex } from '@ethereumjs/util'
import { frameOriginId } from '../../resources/utils'

interface FeeHistoryResponse {
  baseFeePerGas: string[]
  gasUsedRatio: number[]
  reward: Array<string[]>
  oldestBlock: string
}

interface GasPrices {
  slow: string
  standard: string
  fast: string
  asap: string
}

export async function getFeeHistory(
  provider: Provider,
  numBlocks: number,
  rewardPercentiles: number[],
  newestBlock = 'latest'
): Promise<Block[]> {
  const blockCount = intToHex(numBlocks)
  const payload = { method: 'eth_feeHistory', params: [blockCount, newestBlock, rewardPercentiles] }

  const feeHistory = (await provider.send({
    ...payload,
    id: 1,
    jsonrpc: '2.0',
    _origin: frameOriginId
  })) as unknown as FeeHistoryResponse

  const feeHistoryBlocks = feeHistory.baseFeePerGas.map((baseFee, i) => {
    return {
      baseFee: parseInt(baseFee, 16),
      gasUsedRatio: feeHistory.gasUsedRatio[i],
      rewards: (feeHistory.reward[i] || []).map((reward) => parseInt(reward, 16))
    }
  })

  return feeHistoryBlocks
}

async function getGasPrices(provider: Provider): Promise<GasPrices> {
  const gasPrice = (await provider.send({
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    params: [],
    _origin: frameOriginId
  })) as unknown as string

  // in the future we may want to have specific calculators to calculate variations
  // in the gas price or eliminate this structure altogether
  return {
    slow: gasPrice,
    standard: gasPrice,
    fast: gasPrice,
    asap: gasPrice
  }
}

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

  if (eip1559Allowed(chainId) && 'baseFeePerGas' in block) {
    try {
      // only consider this an EIP-1559 block if fee market can be loaded
      const feeHistory = await getFeeHistory(provider, 10, [10])
      const gasCalculator = createGasCalculator(parseInt(chainId))
      feeMarket = gasCalculator.calculateGas(feeHistory)
    } catch (e) {
      feeMarket = null
    }
  }

  let gasPrice

  try {
    if (feeMarket) {
      // TODO: bignum
      const gasPriceInt = parseInt(feeMarket.maxBaseFeePerGas) + parseInt(feeMarket.maxPriorityFeePerGas)
      gasPrice = { fast: addHexPrefix(gasPriceInt.toString(16)) }
    } else {
      gasPrice = await getGasPrices(provider)
    }
  } catch (e) {
    log.error(`could not fetch gas prices for chain ${chainId}`, { feeMarket }, e)
  }

  return { gasPrice, feeMarket }
}
