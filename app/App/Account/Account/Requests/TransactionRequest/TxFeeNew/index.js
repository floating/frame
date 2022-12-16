import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import { DisplayCoinBalance, DisplayValue } from '../../../../../../../resources/Components/DisplayValue'
import { GasFeesSource, usesBaseFee } from '../../../../../../../resources/domain/transaction'
import { displayValueData } from '../../../../../../../resources/utils/displayValue'
import link from '../../../../../../../resources/link'
import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterColumn,
  ClusterValue
} from '../../../../../../../resources/Components/Cluster'

const FEE_WARNING_THRESHOLD_USD = 50

const GasDisplay = ({ maxFeePerGas }) => {
  const { displayValue: gweiDisplayValue } = maxFeePerGas.gwei()
  const shouldDisplayWei = gweiDisplayValue === '0'
  const displayValue = shouldDisplayWei ? maxFeePerGas.wei().displayValue : gweiDisplayValue
  const displayLabel = shouldDisplayWei ? 'Wei' : 'Gwei'

  return (
    <div data-testid='gas-display' className='_txFeeGwei'>
      <span className='_txFeeGweiValue'>{displayValue}</span>
      <span className='_txFeeGweiLabel'>{displayLabel}</span>
    </div>
  )
}

const USDEstimateDisplay = ({ minFee, maxFee, nativeCurrency }) => {
  const { value: maxFeeValue, displayValue, approximationSymbol: maxFeeApproximation } = maxFee.fiat()
  const displayMaxFeeWarning = maxFeeValue > FEE_WARNING_THRESHOLD_USD

  const maxFeeDisplay = <DisplayValue type='fiat' value={maxFee} currencySymbol='$' />
  const feeRange = (
    <>
      <DisplayValue type='fiat' value={minFee} currencySymbol='$' />
      <span>{'-'}</span>
      {maxFeeDisplay}
    </>
  )

  const feeSummary =
    displayValue === '?' ? (
      maxFeeDisplay
    ) : (
      <>
        <span>{'≈'}</span>
        {maxFeeApproximation === '<' ? maxFeeDisplay : feeRange}
      </>
    )

  return (
    <div data-testid='usd-estimate-display' className='clusterTag'>
      <div className={`_txFeeValueDefault${displayMaxFeeWarning ? ' _txFeeValueDefaultWarn' : ''}`}>
        {feeSummary}
        <span>{`in ${nativeCurrency.symbol}`}</span>
      </div>
    </div>
  )
}

class TxFee extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const req = this.props.req
    const chain = {
      type: 'ethereum',
      id: parseInt(req.data.chainId, 16)
    }
    const { isTestnet } = this.store('main.networks', chain.type, chain.id)
    const { nativeCurrency } = this.store('main.networksMeta', chain.type, chain.id)

    const maxGas = BigNumber(req.data.gasLimit, 16)
    const maxFeePerGas = BigNumber(req.data[usesBaseFee(req.data) ? 'maxFeePerGas' : 'gasPrice'])
    const maxFee = displayValueData(maxFeePerGas.multipliedBy(maxGas), {
      currencyRate: nativeCurrency.usd,
      isTestnet
    })

    // accounts for two potential 12.5% block fee increases
    const reduceFactor = BigNumber(9).dividedBy(8)
    const minFeePerGas = maxFeePerGas.dividedBy(reduceFactor).dividedBy(reduceFactor)

    // accounts for the 50% padding in the gas estimate in the provider
    const minGas = maxGas.dividedBy(BigNumber(1.5))
    const minFee = displayValueData(minFeePerGas.multipliedBy(minGas), {
      currencyRate: nativeCurrency.usd,
      isTestnet
    })

    return (
      <ClusterBox title='fee' animationSlot={this.props.i}>
        <Cluster>
          <ClusterRow>
            <ClusterColumn>
              <ClusterValue
                onClick={() => {
                  link.send('nav:update', 'panel', { data: { step: 'adjustFee' } })
                }}
              >
                <GasDisplay maxFeePerGas={displayValueData(maxFeePerGas)} />
              </ClusterValue>
            </ClusterColumn>
            <ClusterColumn grow={2}>
              <ClusterValue>
                <div className='txSendingValue'>
                  <DisplayCoinBalance amount={maxFee} symbol={nativeCurrency.symbol} />
                </div>
              </ClusterValue>
              <ClusterValue>
                <USDEstimateDisplay minFee={minFee} maxFee={maxFee} nativeCurrency={nativeCurrency} />
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
