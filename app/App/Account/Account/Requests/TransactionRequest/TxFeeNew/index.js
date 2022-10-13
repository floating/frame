import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import { usesBaseFee } from '../../../../../../../resources/domain/transaction'
import link from '../../../../../../../resources/link'

import { GasFeesSource } from '../../../../../../../resources/domain/transaction'

const FEE_WARNING_THRESHOLD_USD = 50

function toDisplayUSD (bn) {
  return bn.toFixed(2, BigNumber.ROUND_UP).toString()
}

function toDisplayEther (bn) {
  return parseFloat(bn.shiftedBy(-18).toFixed(6).toString())
}

function toDisplayGwei (bn) {
  return parseFloat(bn.shiftedBy(-9).toFixed(3).toString())
}

function toDisplayWei (bn) {
  return bn.toFormat(0)
}

const GasDisplay = ({ maxFeePerGas }) => {
  const gasGwei = toDisplayGwei(maxFeePerGas)
  const shouldDisplayWei = gasGwei === '0.000'
  const displayValue = shouldDisplayWei ? toDisplayWei(maxFeePerGas) : gasGwei
  const displayLabel = shouldDisplayWei ? 'Wei' : 'Gwei'
  return <div className='_txFeeGwei'>
    <span className='_txFeeGweiValue'>{displayValue}</span>
    <span className='_txFeeGweiLabel'>{displayLabel}</span>
  </div>
}                    

class TxFee extends React.Component {
  constructor (props, context) {
    super(props, context)
  }

  render () {
    const req = this.props.req

    const chain = { 
      type: 'ethereum', 
      id: parseInt(req.data.chainId, 'hex')
    }

    const isTestnet = this.store('main.networks', chain.type, chain.id, 'isTestnet')
    const nativeCurrency = this.store('main.networksMeta', chain.type, chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0

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
                <div className='_txFeeBar _txMainValue _txMainValueClickable' onClick={() => {
                  link.send('nav:update', 'panel', { data: { step: 'adjustFee' } })
                }}>
                  <GasDisplay maxFeePerGas={maxFeePerGas} />
                </div>
              </div>
              <div className='_txMainValuesColumn' style={{ flex: '1' }}>
                <div className='_txMainValue _txFeeTotal'>
                  <div>
                    <span className='_txFeeETH'>
                      {currentSymbol || '?'}
                    </span>
                    <span className='_txFeeETHValue'>
                      {toDisplayEther(maxFee)}
                    </span>
                  </div>
                </div>
                {toDisplayUSD(maxFeeUSD) !== '0.00' ? (
                  <div className='_txMainTagFee'>
                    <div className={maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || toDisplayUSD(maxFeeUSD) === '0.00' ? '_txFeeValueDefault _txFeeValueDefaultWarn' : '_txFeeValueDefault'}>
                      <span className=''>
                        ≈
                      </span>
                      <span className=''>
                        {`$${toDisplayUSD(minFeeUSD)}`}
                      </span>
                      <span className=''>
                        {'-'}
                      </span>
                      <span className=''>
                        {`$${toDisplayUSD(maxFeeUSD)}`}
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
