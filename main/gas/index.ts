import { addHexPrefix, intToHex } from '@ethereumjs/util'
import log from 'electron-log'
import { BigNumber } from 'bignumber.js'

import { Block, estimateGasFees, feesToHex } from './calculator'
import { Provider } from '../provider'
import store from '../store'
import { Chain, GasFees } from '../store/state'
import { frameOriginId } from '../../resources/utils'
import { GasFeesSource, TransactionData, usesBaseFee } from '../../resources/domain/transaction'
import { Common } from '@ethereumjs/common'

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

function calculateMaxFeePerGas(maxBaseFee: string, maxPriorityFee: string) {
  const maxFeePerGas = BigNumber(maxPriorityFee).plus(maxBaseFee).toString(16)
  return addHexPrefix(maxFeePerGas)
}

export function checkExistingNonceGas(tx: TransactionData) {
  const { from, nonce } = tx

  const reqs = store('main.accounts', (from || '').toLowerCase(), 'requests')

  const requests = Object.keys(reqs || {}).map((key) => reqs[key])
  const existing = requests.filter(
    (r) => r.mode === 'monitor' && r.status !== 'error' && r.data.nonce === nonce
  )

  if (existing.length > 0) {
    if (tx.maxPriorityFeePerGas && tx.maxFeePerGas) {
      const existingFee = Math.max(...existing.map((r) => r.data.maxPriorityFeePerGas))
      const existingMax = Math.max(...existing.map((r) => r.data.maxFeePerGas))
      const feeInt = parseInt(tx.maxPriorityFeePerGas)
      const maxInt = parseInt(tx.maxFeePerGas)
      if (existingFee * 1.1 >= feeInt || existingMax * 1.1 >= maxInt) {
        // Bump fees by 10%
        const bumpedFee = Math.max(Math.ceil(existingFee * 1.1), feeInt)
        const bumpedBase = Math.max(Math.ceil((existingMax - existingFee) * 1.1), Math.ceil(maxInt - feeInt))
        tx.maxFeePerGas = '0x' + (bumpedBase + bumpedFee).toString(16)
        tx.maxPriorityFeePerGas = '0x' + bumpedFee.toString(16)
        tx.gasFeesSource = GasFeesSource.Frame
        tx.feesUpdated = true
      }
    } else if (tx.gasPrice) {
      const existingPrice = Math.max(...existing.map((r) => r.data.gasPrice))
      const priceInt = parseInt(tx.gasPrice)
      if (existingPrice >= priceInt) {
        // Bump price by 10%
        const bumpedPrice = Math.ceil(existingPrice * 1.1)
        tx.gasPrice = '0x' + bumpedPrice.toString(16)
        tx.gasFeesSource = GasFeesSource.Frame
        tx.feesUpdated = true
      }
    }
  }

  return tx
}

export function feeTotalOverMax(rawTx: TransactionData, maxTotalFee: number) {
  const maxFeePerGas = usesBaseFee(rawTx)
    ? parseInt(rawTx.maxFeePerGas || '', 16)
    : parseInt(rawTx.gasPrice || '', 16)
  const gasLimit = parseInt(rawTx.gasLimit || '', 16)
  const totalFee = maxFeePerGas * gasLimit
  return totalFee > maxTotalFee
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

  async getFeeHistory(
    numBlocks: number,
    rewardPercentiles: number[],
    newestBlock = 'latest'
  ): Promise<Block[]> {
    const blockCount = intToHex(numBlocks)
    const payload = { method: 'eth_feeHistory', params: [blockCount, newestBlock, rewardPercentiles] }

    const feeHistory = (await this.provider.send({
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

  protected async calculateFees(block: Block) {
    if (eip1559Allowed(this.chainId) && 'baseFeePerGas' in block) {
      try {
        // only consider this an EIP-1559 block if fee market can be loaded
        const feeHistory = await this.getFeeHistory(10, [10])
        const estimatedGasFees = estimateGasFees(feeHistory)

        this.feeMarket = feesToHex(estimatedGasFees)
      } catch (e) {
        this.feeMarket = null
      }
    }

    return this.feeMarket
  }

  protected async getGasPrices() {
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

  populateTransaction(rawTx: TransactionData, chainConfig: Common): TransactionData {
    const txData: TransactionData = { ...rawTx }
    const gas = store('main.networksMeta', 'ethereum', parseInt(rawTx.chainId, 16), 'gas')

    // non-EIP-1559 case
    if (!chainConfig.isActivatedEIP(1559) || !gas.price.fees) {
      txData.type = intToHex(chainConfig.isActivatedEIP(2930) ? 1 : 0)

      const useFrameGasPrice = !rawTx.gasPrice || isNaN(parseInt(rawTx.gasPrice, 16))
      if (useFrameGasPrice) {
        // no valid dapp-supplied value for gasPrice so we use the Frame-supplied value
        const gasPrice = BigNumber(gas.price.levels.fast as string).toString(16)
        txData.gasPrice = addHexPrefix(gasPrice)
        txData.gasFeesSource = GasFeesSource.Frame
      }

      return txData
    }

    // EIP-1559 case
    txData.type = intToHex(2)

    const useFrameMaxFeePerGas = !rawTx.maxFeePerGas || isNaN(parseInt(rawTx.maxFeePerGas, 16))
    const useFrameMaxPriorityFeePerGas =
      !rawTx.maxPriorityFeePerGas || isNaN(parseInt(rawTx.maxPriorityFeePerGas, 16))

    if (!useFrameMaxFeePerGas && !useFrameMaxPriorityFeePerGas) {
      // return tx unaltered when we are using no Frame-supplied values
      return txData
    }

    if (useFrameMaxFeePerGas && useFrameMaxPriorityFeePerGas) {
      // dapp did not supply a valid value for maxFeePerGas or maxPriorityFeePerGas so we change the source flag
      txData.gasFeesSource = GasFeesSource.Frame
    }

    const maxPriorityFee =
      useFrameMaxPriorityFeePerGas && gas.price.fees.maxPriorityFeePerGas
        ? gas.price.fees.maxPriorityFeePerGas
        : (rawTx.maxPriorityFeePerGas as string)

    // if no valid dapp-supplied value for maxFeePerGas we calculate it
    txData.maxFeePerGas =
      useFrameMaxFeePerGas && gas.price.fees.maxBaseFeePerGas
        ? calculateMaxFeePerGas(gas.price.fees.maxBaseFeePerGas, maxPriorityFee)
        : txData.maxFeePerGas

    // if no valid dapp-supplied value for maxPriorityFeePerGas we use the Frame-supplied value
    txData.maxPriorityFeePerGas = useFrameMaxPriorityFeePerGas
      ? addHexPrefix(BigNumber(maxPriorityFee).toString(16))
      : txData.maxPriorityFeePerGas

    return txData
  }

  async getGas(block: Block) {
    const feeMarket = await this.calculateFees(block)
    const gasPrice = await this.getGasPrices()

    return { feeMarket, gasPrice }
  }

  async getGasEstimate(rawTx: TransactionData) {
    const { from, to, value, data, nonce } = rawTx
    const txParams = { from, to, value, data, nonce }

    const payload: JSONRPCRequestPayload = {
      method: 'eth_estimateGas',
      params: [txParams],
      jsonrpc: '2.0',
      id: 1
    }
    const targetChain = {
      type: 'ethereum',
      id: parseInt(rawTx.chainId, 16)
    }

    return new Promise<string>((resolve, reject) => {
      this.provider.connection.send(
        payload,
        (response) => {
          if (response.error) {
            log.warn(`error estimating gas for tx to ${txParams.to}: ${response.error}`)
            return reject(response.error)
          }

          const estimatedLimit = parseInt(response.result, 16)
          const paddedLimit = Math.ceil(estimatedLimit * 1.5)

          log.verbose(
            `gas estimate for tx to ${txParams.to}: ${estimatedLimit}, using ${paddedLimit} as gas limit`
          )
          return resolve(addHexPrefix(paddedLimit.toString(16)))
        },
        targetChain as Chain
      )
    })
  }
}

class PolygonGas extends DefaultGas {
  async calculateFees(block: Block) {
    if ('baseFeePerGas' in block) {
      try {
        const feeHistory = await this.getFeeHistory(10, [10])
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

export function init(provider: Provider, chainIdStr: string) {
  const chainId = parseInt(chainIdStr)
  const ChainSpecificGas = gasChainMap[chainId as keyof typeof gasChainMap]
  return ChainSpecificGas ? new ChainSpecificGas(chainId, provider) : new DefaultGas(chainId, provider)
}
