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
      chainConfig = Common.forCustomChain('mainnet', { chainId }, hardfork)
    }
  }

  return chainConfig
}

function createTransaction (rawTx: any) {
  const chainId = parseInt(rawTx.chainId)
  const chainConfig = getChainConfig(chainId)

  // TODO: maybe pass in block number and use 
  //    chainConfig.hardforkIsActiveOnBlock('london', blockNum)
  return TransactionFactory.fromTxData({
    ...rawTx,
    type: chainConfig.isActivatedEIP(1559) ? '0x2' : '0x0'
  }, { common: chainConfig })
}

const hexPrefix = (s: string) => s.startsWith('0x') ? s : `0x${s}`

function hexifySignature ({ v, r, s }) {
  console.log({ v, hex: v.toString('hex') })
  return {
    v: hexPrefix(v),
    r: hexPrefix(r),
    s: hexPrefix(s)
  }
}

async function sign(rawTx, signingFn) {
  const tx = TransactionFactory.fromTxData(rawTx)

  return signingFn(tx).then(sig => {
    console.log({ sig })
    const signature = hexifySignature(sig)
    
    return Transaction.fromTxData({
      ...rawTx,
      ...signature
    })
  })
}

export {
  createTransaction,
  sign
}
