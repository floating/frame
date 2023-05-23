import { addHexPrefix, intToHex } from '@ethereumjs/util'
import log from 'electron-log'
import { BigNumber } from 'bignumber.js'

import { Block, estimateGasFees, feesToHex } from './calculator'
import { Provider } from '../provider'
import { GasFees } from '../store/state'
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

export const eip1559Allowed = (chainId: number) => !legacyChains.includes(chainId)

class DefaultGas {
  protected chainId: number
  protected provider: Provider
  protected feeMarket: GasFees | null = null

  constructor(chainId: number, provider: Provider) {
    this.chainId = chainId
    this.provider = provider
  }

  async calculateFees(block: Block) {
    if (eip1559Allowed(this.chainId) && 'baseFeePerGas' in block) {
      try {
        // only consider this an EIP-1559 block if fee market can be loaded
        const feeHistory = await getFeeHistory(this.provider, 10, [10])
        const estimatedGasFees = estimateGasFees(feeHistory)

        this.feeMarket = feesToHex(estimatedGasFees)
      } catch (e) {
        this.feeMarket = null
      }
    }

    return this.feeMarket
  }

  async getGasPrices() {
    let gasPrice

    try {
      if (this.feeMarket) {
        const gasPriceBN = BigNumber(this.feeMarket.maxBaseFeePerGas).plus(
          BigNumber(this.feeMarket.maxPriorityFeePerGas)
        )
        gasPrice = { fast: addHexPrefix(gasPriceBN.toString(16)) }
      } else {
        gasPrice = await getGasPrices(this.provider)
      }
    } catch (e) {
      log.error(`could not fetch gas prices for chain ${this.chainId}`, { feeMarket: this.feeMarket }, e)
    }

    return gasPrice
  }
}

class PolygonGas extends DefaultGas {
  async calculateFees(block: Block) {
    if ('baseFeePerGas' in block) {
      try {
        const feeHistory = await getFeeHistory(this.provider, 10, [10])
        const estimatedGasFees = estimateGasFees(feeHistory)
        const maxPriorityFeePerGas = Math.max(estimatedGasFees.maxPriorityFeePerGas, 30e9)

        this.feeMarket = feesToHex({
          ...estimatedGasFees,
          maxPriorityFeePerGas,
          maxFeePerGas: estimatedGasFees.maxBaseFeePerGas + maxPriorityFeePerGas
        })
      } catch (e) {
        this.feeMarket = null
      }
    }

    return this.feeMarket
  }
}

const gasChainMap = {
  137: PolygonGas,
  80001: PolygonGas
}

export async function getGas(provider: Provider, chainIdStr: string, block: Block) {
  const chainId = parseInt(chainIdStr)
  const ChainSpecificGas = gasChainMap[chainId as keyof typeof gasChainMap]
  const gas = ChainSpecificGas ? new ChainSpecificGas(chainId, provider) : new DefaultGas(chainId, provider)
  const feeMarket = await gas.calculateFees(block)
  const gasPrice = await gas.getGasPrices()

  return { gasPrice, feeMarket }
}
