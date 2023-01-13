import { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../svg'
import { weiToGwei, hexToInt } from '../../utils'

// estimated gas to perform various common tasks
const gasToSendEth = 21 * 1000
const gasToSendToken = 65 * 1000
const gasForDexSwap = 200 * 1000

function roundGwei(gwei) {
  return parseFloat(
    gwei >= 10
      ? Math.round(gwei)
      : gwei >= 5
      ? Math.round(gwei * 10) / 10
      : gwei >= 1
      ? Math.round(gwei * 100) / 100
      : Math.round(gwei * 1000) / 1000
  )
}

function levelDisplay(level) {
  const gwei = weiToGwei(hexToInt(level))
  return roundGwei(gwei) || 0
}

function toDisplayUSD(bn) {
  return parseFloat(
    bn.toNumber() >= 1
      ? bn.toFixed(0, BigNumber.ROUND_UP).toString()
      : bn.toFixed(2, BigNumber.ROUND_UP).toString()
  )
}

function txEstimate(value, gasLimit, nativeUSD) {
  return toDisplayUSD(
    BigNumber(value * gasLimit)
      .shiftedBy(-9)
      .multipliedBy(nativeUSD)
  )
}

const GasFees = ({ gasPrice }) => (
  <div className='gasItem gasItemLarge'>
    <div className='gasGweiNum'>{gasPrice}</div>
    <span className='gasGweiLabel'>{'GWEI'}</span>
    <span className='gasLevelLabel'>{'Recommended'}</span>
  </div>
)

const GasFeesMarket = ({ gasPrice, fees: { nextBaseFee, maxPriorityFeePerGas } }) => {
  const [displayBaseHint, setDisplayBaseHint] = useState(false)
  const [displayPriorityHint, setDisplayPriorityHint] = useState(false)
  const calculatedFees = {
    actualBaseFee: roundGwei(weiToGwei(hexToInt(nextBaseFee))),
    priorityFee: levelDisplay(maxPriorityFeePerGas)
  }

  return (
    <>
      {displayBaseHint && (
        <div className='feeToolTip feeToolTipBase cardShow'>
          The current base fee is added with a buffer to cover the next 3 blocks, any amount greater than your
          block&apos;s base fee is refunded
        </div>
      )}
      {displayPriorityHint && (
        <div className='feeToolTip feeToolTipPriority cardShow'>
          A priority tip paid to validators is added to incentivize quick inclusion of your transaction into a
          block
        </div>
      )}
      <div className='gasItem gasItemSmall'>
        <div className='gasGweiNum'>{calculatedFees.actualBaseFee || '‹0.001'}</div>
        <span className='gasGweiLabel'>{'GWEI'}</span>
        <span className='gasLevelLabel'>{'Current Base'}</span>
      </div>
      <div className='gasItem gasItemLarge'>
        <div
          className='gasArrow'
          onClick={() => setDisplayBaseHint(true)}
          onMouseLeave={() => setDisplayBaseHint(false)}
        >
          <div className='gasArrowNotify'>+</div>
          <div className='gasArrowInner'>{svg.chevron(27)}</div>
        </div>
        <div className='gasGweiNum'>{gasPrice || '‹0.001'}</div>
        <span className='gasGweiLabel'>{'GWEI'}</span>
        <span className='gasLevelLabel'>{'Recommended'}</span>
        <div
          className='gasArrow gasArrowRight'
          onClick={() => setDisplayPriorityHint(true)}
          onMouseLeave={() => setDisplayPriorityHint(false)}
        >
          <div className='gasArrowInner'>{svg.chevron(27)}</div>
        </div>
      </div>
      <div className='gasItem gasItemSmall'>
        <div className='gasGweiNum'>{calculatedFees.priorityFee || '‹0.001'}</div>
        <span className='gasGweiLabel'>{'GWEI'}</span>
        <span className='gasLevelLabel'>{'Priority Tip'}</span>
      </div>
    </>
  )
}

class GasSummaryComponent extends Component {
  constructor(...args) {
    super(...args)
  }

  txEstimates(type, id, gasPrice, calculatedFees, currentSymbol) {
    const estimates = [
      {
        label: `Send ${currentSymbol}`,
        estimatedGas: gasToSendEth
      },
      {
        label: 'Send Tokens',
        estimatedGas: gasToSendToken
      },
      {
        label: 'Dex Swap',
        estimatedGas: gasForDexSwap
      }
    ]

    const isTestnet = this.store('main.networks', type, id, 'isTestnet')
    const nativeCurrency = this.store('main.networksMeta', type, id, 'nativeCurrency')
    const nativeUSD = BigNumber(
      nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0
    )

    if (id === 10) {
      // Optimism specific calculations
      // TODO: re-structure the way we store and model gas fees

      const l1GasEstimates = [4300, 5100, 6900]
      const ethPriceLevels = this.store('main.networksMeta.ethereum', 1, 'gas.price.levels')
      const l1Price = levelDisplay(ethPriceLevels.fast)

      const optimismEstimate = (l1Limit, l2Limit) => {
        const l1Estimate = BigNumber(l1Price * l1Limit * 1.5)
        const l2Estimate = BigNumber(gasPrice * l2Limit)

        return toDisplayUSD(l1Estimate.plus(l2Estimate).shiftedBy(-9).multipliedBy(nativeUSD))
      }

      return estimates.map(({ label, estimatedGas }, i) => ({
        low: optimismEstimate(l1GasEstimates[i], estimatedGas),
        high: optimismEstimate(l1GasEstimates[i], estimatedGas),
        label
      }))
    }

    const low = calculatedFees
      ? roundGwei(calculatedFees.actualBaseFee + calculatedFees.priorityFee)
      : gasPrice

    return estimates.map(({ label, estimatedGas }) => ({
      low: txEstimate(low, estimatedGas, nativeUSD),
      high: txEstimate(gasPrice, estimatedGas, nativeUSD),
      label
    }))
  }

  feeEstimatesUSD() {
    const { chainId, displayFeeMarket, gasPrice } = this.props
    const type = 'ethereum'
    const currentSymbol = this.store('main.networksMeta', type, chainId, 'nativeCurrency', 'symbol') || 'ETH'

    if (!displayFeeMarket) {
      return this.txEstimates(type, chainId, gasPrice, null, currentSymbol)
    }

    const { nextBaseFee, maxPriorityFeePerGas } = this.store(
      'main.networksMeta',
      type,
      chainId,
      'gas.price.fees'
    )
    const calculatedFees = {
      actualBaseFee: roundGwei(weiToGwei(hexToInt(nextBaseFee))),
      priorityFee: levelDisplay(maxPriorityFeePerGas)
    }

    return this.txEstimates(type, chainId, gasPrice, calculatedFees, currentSymbol)
  }

  render() {
    const { gasPrice } = this.props

    return (
      <>
        <div className='sliceTileGasPrice'>
          <div className='sliceTileGasPriceIcon'>{svg.gas(9)}</div>
          <div className='sliceTileGasPriceNumber'>{gasPrice || '‹0.001'}</div>
          <div className='sliceTileGasPriceUnit'>{'gwei'}</div>
        </div>
        <div className='sliceGasEstimateBlock'>
          {this.feeEstimatesUSD().map((estimate, i) => {
            return (
              <div className='gasEstimate' key={i}>
                <div className='gasEstimateRange'>
                  <span className='gasEstimateSymbol'>
                    {!estimate.low || estimate.low >= 0.01 ? `$` : '<$'}
                  </span>
                  <span className='gasEstimateRangeLow'>{`${
                    !estimate.low
                      ? 0
                      : estimate.low < 0.01
                      ? 0.01
                      : estimate.low < 1
                      ? estimate.low.toFixed(2)
                      : estimate.low
                  }`}</span>
                </div>
                <div className='gasEstimateLabel'>{estimate.label}</div>
              </div>
            )
          })}
        </div>
      </>
    )
  }
}

const GasSummary = Restore.connect(GasSummaryComponent)

class Gas extends Component {
  constructor(...args) {
    super(...args)
    this.state = {
      expand: false
    }
  }

  render() {
    const { chainId } = this.props
    const type = 'ethereum'
    const fees = this.store('main.networksMeta', type, chainId, 'gas.price.fees')
    const levels = this.store('main.networksMeta', type, chainId, 'gas.price.levels')
    const gasPrice = levelDisplay(levels.fast)

    // fees is either a populated object (EIP-1559 compatible) or falsy
    const displayFeeMarket = !!fees

    return (
      <div className='sliceContainer' ref={this.ref}>
        <div
          className='sliceTile sliceTileClickable'
          onClick={() => {
            this.setState({ expanded: !this.state.expanded })
          }}
        >
          <GasSummary chainId={chainId} displayFeeMarket={displayFeeMarket} gasPrice={gasPrice} />
        </div>
        {this.state.expanded ? (
          <div className='sliceGasBlock'>
            {displayFeeMarket ? (
              <GasFeesMarket gasPrice={gasPrice} fees={fees} />
            ) : (
              <GasFees gasPrice={gasPrice} />
            )}
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Gas)
