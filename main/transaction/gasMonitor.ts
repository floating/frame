import { intToHex } from '@ethereumjs/util'

import type { Block } from '../chains/gas'

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

export default class GasMonitor {
  private connection

  constructor(connection: any /* Chains */) {
    this.connection = connection
  }

  async getFeeHistory(
    numBlocks: number,
    rewardPercentiles: number[],
    newestBlock = 'latest'
  ): Promise<Block[]> {
    const blockCount = intToHex(numBlocks)
    const payload = { method: 'eth_feeHistory', params: [blockCount, newestBlock, rewardPercentiles] }

    const feeHistory: FeeHistoryResponse = await this.connection.send(payload)

    const feeHistoryBlocks = feeHistory.baseFeePerGas.map((baseFee, i) => {
      return {
        baseFee: parseInt(baseFee, 16),
        gasUsedRatio: feeHistory.gasUsedRatio[i],
        rewards: (feeHistory.reward[i] || []).map((reward) => parseInt(reward, 16))
      }
    })

    return feeHistoryBlocks
  }

  async getGasPrices(): Promise<GasPrices> {
    const gasPrice = await this.connection.send({ method: 'eth_gasPrice' })

    // in the future we may want to have specific calculators to calculate variations
    // in the gas price or eliminate this structure altogether
    return {
      slow: gasPrice,
      standard: gasPrice,
      fast: gasPrice,
      asap: gasPrice
    }
  }
}
