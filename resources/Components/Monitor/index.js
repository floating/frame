import { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../link'

import { ClusterRow, ClusterValue } from '../Cluster'

import svg from '../../svg'
import { weiToGwei, hexToInt } from '../../utils'
import { chainUsesOptimismFees, calculateOptimismL1DataFee } from '../../utils/chains'

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
        estimatedGas: gasToSendEth,
        serializedTxExample:
          '0x02ed0a80832463478324670d827b0c94b120c885f1527394c78d50e7c7da57defb24f6128802c68af0bb14000080c0'
      },
      {
        label: 'Send Tokens',
        estimatedGas: gasToSendToken,
        serializedTxExample:
          '0x02f86b0a808319d7678319d7f38302135494420000000000000000000000000000000000004280b844a9059cbb000000000000000000000000b120c885f1527394c78d50e7c7da57defb24f612000000000000000000000000000000000000000000000001a055690d9db80000c0'
      },
      {
        label: 'Dex Swap',
        estimatedGas: gasForDexSwap,
        serializedTxExample:
          '0x02f86a0a80830e9f70830ea00882b85894420000000000000000000000000000000000004280b844095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0'
      }
    ]

    const isTestnet = this.store('main.networks', type, id, 'isTestnet')
    const nativeCurrency = this.store('main.networksMeta', type, id, 'nativeCurrency')
    const nativeUSD = BigNumber(
      nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0
    )

    if (chainUsesOptimismFees(id)) {
      // Optimism specific calculations
      const price = calculatedFees?.actualFee || gasPrice

      const ethBaseFee = this.store('main.networksMeta.ethereum', 1, 'gas.price.fees.nextBaseFee')

      const optimismEstimate = (serializedTx, l2Limit) => {
        const l1Estimate = BigNumber(calculateOptimismL1DataFee(serializedTx, ethBaseFee)).shiftedBy(-9)
        const l2Estimate = BigNumber(price * l2Limit)

        return toDisplayUSD(l1Estimate.plus(l2Estimate).shiftedBy(-9).multipliedBy(nativeUSD))
      }

      return estimates.map(({ label, estimatedGas, serializedTxExample }, i) => ({
        low: optimismEstimate(serializedTxExample, estimatedGas),
        high: optimismEstimate(serializedTxExample, estimatedGas),
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
