import { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../link'

import { ClusterRow, ClusterValue } from '../Cluster'

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

const GasFees = ({ gasPrice, color }) => (
  <div className='gasItem gasItemLarge'>
    <div className='gasGweiNum'>{gasPrice}</div>
    <span className='gasGweiLabel' style={{ color }}>
      {'GWEI'}
    </span>
    <span className='gasLevelLabel'>{'Recommended'}</span>
  </div>
)

const GasFeesMarket = ({ gasPrice, fees: { nextBaseFee, maxPriorityFeePerGas }, color }) => {
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
        <span className='gasGweiLabel' style={{ color }}>
          {'GWEI'}
        </span>
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
        <span className='gasGweiLabel' style={{ color }}>
          {'GWEI'}
        </span>
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
        <span className='gasGweiLabel' style={{ color }}>
          {'GWEI'}
        </span>
        <span className='gasLevelLabel'>{'Priority Tip'}</span>
      </div>
    </>
  )
}

class ChainSummaryComponent extends Component {
  constructor(...args) {
    super(...args)
    this.state = {
      expand: false
    }
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

  feeEstimatesUSD({ chainId, displayFeeMarket, gasPrice }) {
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
    const { address, chainId } = this.props
    const type = 'ethereum'
    const currentChain = { type, id: chainId }
    const fees = this.store('main.networksMeta', type, chainId, 'gas.price.fees')
    const levels = this.store('main.networksMeta', type, chainId, 'gas.price.levels')
    const gasPrice = levelDisplay(levels.fast)

    const explorer = this.store('main.networks', type, chainId, 'explorer')

    // fees is either a populated object (EIP-1559 compatible) or falsy
    const displayFeeMarket = !!fees

    const actualFee = displayFeeMarket
      ? Math.round(roundGwei(weiToGwei(hexToInt(fees.nextBaseFee))) + levelDisplay(fees.maxPriorityFeePerGas))
      : gasPrice

    return (
      <>
        <ClusterRow>
          <ClusterValue
            onClick={() => {
              this.setState({ expanded: !this.state.expanded })
            }}
          >
            <div className='sliceTileGasPrice'>
              <div className='sliceTileGasPriceIcon' style={{ color: this.props.color }}>
                {svg.gas(12)}
              </div>
              <div className='sliceTileGasPriceNumber'>{actualFee || '‹0.001'}</div>
              <div className='sliceTileGasPriceUnit'>{'gwei'}</div>
            </div>
          </ClusterValue>
          <ClusterValue
            style={{ minWidth: '70px', maxWidth: '70px' }}
            onClick={
              explorer
                ? () => {
                    if (address) {
                      link.send('tray:openExplorer', {
                        type: 'address',
                        chain: currentChain,
                        address
                      })
                    } else {
                      link.rpc('openExplorer', currentChain, () => {})
                    }
                  }
                : undefined
            }
          >
            <div style={{ padding: '6px', color: !explorer && 'var(--outerspace05)' }}>
              <div>{address ? svg.accounts(16) : svg.telescope(18)}</div>
            </div>
          </ClusterValue>
        </ClusterRow>
        {this.state.expanded && (
          <ClusterRow>
            <ClusterValue allowPointer={true}>
              <div className='sliceGasBlock'>
                {displayFeeMarket ? (
                  <GasFeesMarket gasPrice={gasPrice} fees={fees} color={this.props.color} />
                ) : (
                  <GasFees gasPrice={gasPrice} color={this.props.color} />
                )}
              </div>
            </ClusterValue>
          </ClusterRow>
        )}
        <ClusterRow>
          {this.feeEstimatesUSD({ chainId, displayFeeMarket, gasPrice }).map((estimate, i) => {
            return (
              <ClusterValue key={i}>
                <div className='gasEstimate'>
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
                  <div className='gasEstimateLabel' style={{ color: this.props.color }}>
                    {estimate.label}
                  </div>
                </div>
              </ClusterValue>
            )
          })}
        </ClusterRow>
      </>
    )
  }
}

const Monitor = Restore.connect(ChainSummaryComponent)

export default Restore.connect(Monitor)
