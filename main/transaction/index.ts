import { BN, stripHexPrefix } from 'ethereumjs-util'
import { Capability, Transaction, TransactionFactory } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

export interface RawTransaction { 
  chainId: string | number
}

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

function toHex(bn: BN) {
  return `0x${bn.toString('hex')}`
}

function toBN(hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

async function populate (rawTx: any, chainConfig: Common, gasCalculator) {
  const chainId = parseInt(rawTx.chainId)
  const txData =  { ...rawTx }

  // calculate needed gas if not already provided
  try {
    txData.gasLimit = txData.gasLimit || (await gasCalculator.getGasEstimate(rawTx))
  } catch (e) {
    txData.gasLimit = '0x0'
    txData.warning = e.message
  }

  if (chainConfig.hardforkIsActiveOnBlock('london', '0xa1d009')) {
    console.log('london hardfork active!')
    txData.type = '0x2'

    const maxPriorityFee = toBN(gasCalculator.getMaxPriorityFeePerGas(txData))
    const maxBaseFee = toBN(gasCalculator.getMaxBaseFeePerGas(txData))
    const maxFee = maxPriorityFee.add(maxBaseFee)

    txData.maxPriorityFeePerGas = toHex(maxPriorityFee)
    txData.maxFeePerGas = toHex(maxFee)
    txData.maxFee = txData.maxFeePerGas
  } else {
    console.log('london hardfork NOT active!')
    txData.type = '0x0'

    const gasPrice = toBN(gasCalculator.getGasPrice(txData))

    txData.gasPrice = toHex(gasPrice)
    txData.maxFee = toHex(toBN(txData.gasLimit).mul(gasPrice))
  }

  console.log({ txData })

  return txData
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
  populate,
  sign
}


