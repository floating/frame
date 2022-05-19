import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import { usesBaseFee } from '../../../../../../../main/transaction'

const FEE_WARNING_THRESHOLD_USD = 50

class TxFee extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.chain = { 
      type: 'ethereum', 
      id: parseInt(props.req.data.chainId, 'hex')
    }
  }
  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }
  toDisplayEther (bn) {
    return parseFloat(bn.shiftedBy(-18).toFixed(6).toString())
  }
  toDisplayGwei (bn) {
    return parseFloat(bn.shiftedBy(-9).toFixed(3).toString())
  }
  render () {
    const req = this.props.req

    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0

    let maxFeePerGas, maxFee, maxFeeUSD

    const maxGas = BigNumber(req.data.gasLimit, 16)

    if (usesBaseFee(req.data)) {
      maxFeePerGas = BigNumber(req.data.maxFeePerGas, 16)
      maxFee = maxFeePerGas.multipliedBy(maxGas)
      maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
    } else {
      maxFeePerGas = BigNumber(req.data.gasPrice, 16)
      maxFee = maxFeePerGas.multipliedBy(maxGas)
      maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
    }

    // accounts for a 12.5% reduction in the block base fee
    const minFeePerGas = maxFeePerGas.dividedBy(BigNumber(1.14))

    // accounts for the 50% padding in the gas estimate in the provider
    const minGas = maxGas.dividedBy(BigNumber(1.5))

    const minFee = minFeePerGas.multipliedBy(minGas)
    const minFeeUSD = minFee.shiftedBy(-18).multipliedBy(nativeUSD)

    const currentSymbol = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'symbol') || '?'
    
    return (
      <div className='_txFee'>
        <div className='_txFeeInner'>
          <div className='_txFeeSlice _txFeeLabel'>max fee</div>
          <div className='_txFeeSlice _txFeeGwei' onClick={() => {
            this.props.overlayMode('fee')
          }}>
            <span className='_txFeeGweiValue'>{this.toDisplayGwei(maxFeePerGas)}</span>
            <span className='_txFeeGweiLabel'>Gwei</span>
          </div>
          {this.toDisplayUSD(maxFeeUSD) === '0.00' ? (
            <div className='_txFeeSlice _txFeeValue'>
              <div className='_txFeeValueDefaultWarn'>
                <span className='_txFeeETH'>
                  {currentSymbol || '?'}
                </span>
                <span className='_txFeeETHValue'>
                  {this.toDisplayEther(maxFee)}
                </span>
              </div> 
            </div>
          ) : (
            <div className='_txFeeSlice _txFeeValue'>
              <div className={maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00' ? '_txFeeValueDefault _txFeeValueDefaultWarn' : '_txFeeValueDefault'}>
                <span className='_txFeeEq'>
                  ≈
                </span>
                <span className='_txFeeUSDSymbol'>
                  $
                </span>
                <span className='_txFeeUSD'>
                  {`${this.toDisplayUSD(minFeeUSD)} - ${this.toDisplayUSD(maxFeeUSD)}`}
                </span>
                <span className='_txFeeUSDDescription'>
                  {`in ${currentSymbol || '?'}`}
                </span>
              </div>

              <div className='_txFeeValueHover'>
                <span className='_txFeeETH'>
                  {currentSymbol || '?'}
                </span>
                <span className='_txFeeETHValue'>
                  {this.toDisplayEther(maxFee)}
                </span>
              </div> 
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxFee)
