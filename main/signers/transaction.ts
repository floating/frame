import { BN } from 'ethereumjs-util'
import { Capability, Transaction, TransactionFactory } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

export interface TransactionData {
  chainId: string,
}

// TODO: how do we determine these chain configs in real time?
const chains = <{ [key: string]: Common }>{
  1: new Common({ chain: 'mainnet', hardfork: 'berlin' }),
  3: new Common({ chain: 'ropsten', hardfork: 'london', eips: [1559] }),
  4: new Common({ chain: 'rinkeby', hardfork: 'london', eips: [1559] }),
  5: new Common({ chain: 'goerli', hardfork: 'london', eips: [1559] })
}

function getChainConfig(chainId: number, hardfork = 'london') {
  let chainConfig = chains[chainId]

  if (!chainConfig) {
    if (Common.isSupportedChainId(new BN(chainId))) {
      chainConfig = new Common({ chain: chainId, hardfork })
    } else {
      chainConfig = Common.forCustomChain('mainnet', { chainId })
    }
  }

  return chainConfig
}

function createTransaction (rawTx: any) {
  const chainId = parseInt(rawTx.chainId)
  const chainConfig = getChainConfig(chainId)

  const tx = TransactionFactory.fromTxData(rawTx, { common: chainConfig })

  if (tx.supports(Capability.EIP1559FeeMarket)) {
    // TODO: do we need to do anything here?
  }

  return tx
}

export default createTransaction
