import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import { usesBaseFee, GasFeesSource } from '../../../../../../../resources/domain/transaction'
import link from '../../../../../../../resources/link'

import { ClusterBox, Cluster, ClusterRow, ClusterColumn, ClusterValue } from '../../../../../../../resources/Components/Cluster'

const FEE_WARNING_THRESHOLD_USD = 50

function toDisplayUSD (bn) {
  const usd = bn.decimalPlaces(2, BigNumber.ROUND_FLOOR)
  return usd.isZero() ? '< $0.01' : `$${usd.toFormat()}`
}

function toDisplayEther (bn) {
  const ether = bn.shiftedBy(-18).decimalPlaces(6, BigNumber.ROUND_FLOOR)

  return ether.isZero() ? '< 0.000001' : ether.toFormat()
}

function toDisplayGwei (bn) {
  const gwei = bn.shiftedBy(-9).decimalPlaces(6, BigNumber.ROUND_FLOOR)

  return gwei.isZero() ? '' : gwei.toFormat()
}

function toDisplayWei (bn) {
  return bn.toFormat(0)
}

const GasDisplay = ({ maxFeePerGas }) => {
  const gweiDisplayValue = toDisplayGwei(maxFeePerGas)
  const displayValue = gweiDisplayValue || toDisplayWei(maxFeePerGas)
  const displayLabel = !!gweiDisplayValue ? 'Gwei' : 'Wei'

  return (
    <div data-testid='gas-display' className='_txFeeGwei'>
      <span className='_txFeeGweiValue'>{displayValue}</span>
      <span className='_txFeeGweiLabel'>{displayLabel}</span>
    </div>
  )
}     

const USDEstimateDisplay = ({ maxFeePerGas, maxGas, maxFeeUSD, nativeUSD, symbol }) => {
  // accounts for two potential 12.5% block fee increases
  const reduceFactor = BigNumber(9).dividedBy(8)
  const minFeePerGas = maxFeePerGas.dividedBy(reduceFactor).dividedBy(reduceFactor)

  // accounts for the 50% padding in the gas estimate in the provider
  const minGas = maxGas.dividedBy(BigNumber(1.5))

  const minFee = minFeePerGas.multipliedBy(minGas)
  const minFeeUSD = minFee.shiftedBy(-18).multipliedBy(nativeUSD)
  const displayMinFeeUSD = toDisplayUSD(minFeeUSD)
  const displayMaxFeeUSD = toDisplayUSD(maxFeeUSD)
  
  return <div data-testid='usd-estimate-display' className='clusterTag'>
    <div className={maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD ? '_txFeeValueDefault _txFeeValueDefaultWarn' : '_txFeeValueDefault'}>
      <span>{'≈'}</span>
      {displayMaxFeeUSD === '< $0.01' ? 
      <span>{displayMaxFeeUSD}</span> : 
      <>      
        <span>{displayMinFeeUSD}</span>
        <span>{'-'}</span>
        <span>{displayMaxFeeUSD}</span>
      </>
      }
      <span>{`in ${symbol}`}</span>
    </div>
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
      id: parseInt(req.data.chainId, 16)
    }

    const { isTestnet } = this.store('main.networks', chain.type, chain.id)
    const {nativeCurrency, nativeCurrency: {symbol}} = this.store('main.networksMeta', chain.type, chain.id,)
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

    const displayEther = toDisplayEther(maxFee)

    return (
      <ClusterBox title={'fee'} animationSlot={this.props.i}>
        <Cluster>
          <ClusterRow>
            <ClusterColumn>
              <ClusterValue onClick={() => {
                link.send('nav:update', 'panel', { data: { step: 'adjustFee' } })
              }}>
                <GasDisplay maxFeePerGas={maxFeePerGas} />
              </ClusterValue>
            </ClusterColumn>
            <ClusterColumn grow={2}>
              <ClusterValue>
                <div className='txSendingValue'>
                  <span className='txSendingValueSymbol'>{symbol}</span>
                  <span className='txSendingValueAmount'>{displayEther}</span>
                </div>
              </ClusterValue>
              <ClusterValue>
                <USDEstimateDisplay maxFeePerGas={maxFeePerGas} maxGas={maxGas} maxFeeUSD={maxFeeUSD} nativeUSD={nativeUSD} symbol={symbol} />
              </ClusterValue>
            </ClusterColumn>
          </ClusterRow>
          {req.feesUpdatedByUser ? (
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag' style={{ color: 'var(--good)' }}>
                  {`Gas values set by user`}
                </div>
              </ClusterValue>
            </ClusterRow>
          ) : req.data.gasFeesSource !== GasFeesSource.Frame ? (
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag' style={{ color: 'var(--bad)' }}>
                  {`Gas values set by ${req.data.gasFeesSource}`}
                </div>
              </ClusterValue>
            </ClusterRow>
          ) : null}
        </Cluster>
      </ClusterBox>
    )
  }
}

export default Restore.connect(TxFee)
