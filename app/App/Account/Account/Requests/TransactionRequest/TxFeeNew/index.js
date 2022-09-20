import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import { usesBaseFee } from '../../../../../../../resources/domain/transaction'
import link from '../../../../../../../resources/link'

import { GasFeesSource } from '../../../../../../../resources/domain/transaction'

const FEE_WARNING_THRESHOLD_USD = 50

class TxFee extends React.Component {
  constructor (props, context) {
    super(props, context)
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

    const chain = { 
      type: 'ethereum', 
      id: parseInt(req.data.chainId, 'hex')
    }

    const layer = this.store('main.networks', chain.type, chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', chain.type, chain.id, 'nativeCurrency')
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

    // accounts for two potential 12.5% block fee increases
    const reduceFactor = BigNumber(9).dividedBy(8)
    const minFeePerGas = maxFeePerGas.dividedBy(reduceFactor).dividedBy(reduceFactor)

    // accounts for the 50% padding in the gas estimate in the provider
    const minGas = maxGas.dividedBy(BigNumber(1.5))

    const minFee = minFeePerGas.multipliedBy(minGas)
    const minFeeUSD = minFee.shiftedBy(-18).multipliedBy(nativeUSD)

    const currentSymbol = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'symbol') || '?'

    return (
      <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
        <div className='_txMainInner'>
          <div className='_txLabel'>Fee</div>
          <div className='_txMainValues'>
            <div className='_txMainValuesRow'>
              <div className='_txMainValuesColumn' style={{ flex: '1' }}>
                <div className='_txFeeBar' onClick={() => {
                  link.send('nav:update', 'panel', { data: { step: 'adjustFee' } })
                }}>
                  <div className='_txFeeGwei'>
                    <span className='_txFeeGweiValue'>{this.toDisplayGwei(maxFeePerGas)}</span>
                    <span className='_txFeeGweiLabel'>Gwei</span>
                  </div>
                </div>
              </div>
              <div className='_txMainValuesColumn' style={{ flex: '1' }}>
                <div className='_txFeeTotal'>
                  <div>
                    <span className='_txFeeETH'>
                      {currentSymbol || '?'}
                    </span>
                    <span className='_txFeeETHValue'>
                      {this.toDisplayEther(maxFee)}
                    </span>
                  </div>
                </div>
                {this.toDisplayUSD(maxFeeUSD) !== '0.00' ? (
                  <div className='_txMainTag'>
                    <div className={maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00' ? '_txFeeValueDefault _txFeeValueDefaultWarn' : '_txFeeValueDefault'}>
                      <span className=''>
                        ≈
                      </span>
                      <span className=''>
                        {`$${this.toDisplayUSD(minFeeUSD)}`}
                      </span>
                      <span className=''>
                        {'-'}
                      </span>
                      <span className=''>
                        {`$${this.toDisplayUSD(maxFeeUSD)}`}
                      </span>
                      <span className=''>
                        {`in ${currentSymbol || '?'}`}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {req.feesUpdatedByUser ? (
              <div className='_txMainTag'>
                {`Gas values set by user`}
              </div>
            ) : req.data.gasFeesSource !== GasFeesSource.Frame ? (
              <div className='_txMainTag'>
                {`Gas values set by ${req.data.gasFeesSource}`}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxFee)
