import React, { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../../resources/link'
import { usesBaseFee } from '../../../../../../../resources/domain/transaction'

function toDisplayFromWei (bn) {
  return bn.shiftedBy(-9).decimalPlaces(9).toString()
}

function toDisplayFromGwei (bn) {
  return bn.decimalPlaces(9).toString()
}

function trimGwei (bn) {
  return BigNumber(bn.toFixed(9))
}

function gweiToWei (bn) {
  return bn.times(1e9)
}

function gweiToWeiHex (bn) {
  return `0x${gweiToWei(bn).toString(16)}`
}

function limitRange (bn, min = 0, max = 9999) {
  if (bn.gt(max)) return BigNumber(max)
  if (bn.lt(min)) return BigNumber(min)
  return bn
}

function formatForInput (num, decimals) {
  return decimals ? toDisplayFromGwei(BigNumber(num)) : num.toString()
}

function getMaxTotalFee (tx = { chainId: '' }) {
  const chainId = parseInt(tx.chainId)

  // for ETH-based chains, the max fee should be 2 ETH
  if ([1, 3, 4, 5, 6, 10, 42, 61, 62, 63, 69, 42161, 421611].includes(chainId)) {
    return 2 * 1e18
  }

  // for Fantom, the max fee should be 250 FTM
  if ([250, 4002].includes(chainId)) {
    return 250 * 1e18
  }

  // for all other chains, default to 50 of the chain's currency
  return 50 * 1e18
}

const defaultLimiter = (bn) => trimGwei(limitRange(bn))

const FeeOverlayInput = ({ initialValue, labelText, tabIndex, decimals, onReceiveValue, limiter = defaultLimiter }) => {
  const [value, setValue] = useState(initialValue)
  const [submitTimeout, setSubmitTimeout] = useState(0)
  const processValue = (newValueBN) => {
    const limitedValueBN = limiter(newValueBN)
    onReceiveValue(limitedValueBN)
    setValue(formatForInput(limitedValueBN, decimals))
  }
  const submitValue = (newValueStr, newValueBN) => {
    setValue(newValueStr)
    clearTimeout(submitTimeout)

    setSubmitTimeout(
      setTimeout(() => processValue(newValueBN), 500)
    )
  }
  const labelId = `txFeeOverlayLabel_${tabIndex}`

  return (
    <>
      <div className='txFeeOverlayInput'>
        <input 
          tabIndex={tabIndex} 
          value={value}
          className='txFeeOverlayInput' 
          aria-labelledby={labelId}
          onChange={(e) => {
            const value = (decimals ? /[0-9\.]*/ : /[0-9]*/).exec(e.target.value)
            if (value) {
              // special case to prevent decimal point being overwritten as user is typing a float
              if (value[0].endsWith('.')) {
                const formattedNum = formatForInput(value[0].slice(0, -1), decimals)
                setValue(`${formattedNum}.`)
                clearTimeout(submitTimeout)
                return
              }

              const parsedValue = BigNumber(value[0])
              if (parsedValue.isNaN()) {
                return
              }

              submitValue(value[0], parsedValue)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const parsedValue = BigNumber(value)
              if (parsedValue.isNaN()) {
                return
              }

              let newValue
              if (e.key === 'ArrowUp') {
                newValue = decimals ? parsedValue.decimalPlaces(9, BigNumber.ROUND_FLOOR).plus(1) : parsedValue.plus(1000)
              } else {
                newValue = decimals ? parsedValue.decimalPlaces(9, BigNumber.ROUND_FLOOR).minus(1) : parsedValue.minus(1000)
              }
              const limitedValue = limiter(newValue)
              submitValue(limitedValue.toString(), limitedValue)
            }
          }}
        />
      </div>
      <div id={labelId} className='txFeeOverlayLabel'>{labelText}</div>
    </>
  )
}

const GasLimitInput = ({ initialValue, onReceiveValue, tabIndex }) => 
  <div className='txFeeOverlayLimit'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Gas Limit (UNITS)' tabIndex={tabIndex} decimals={false} limiter={(bn) => limitRange(bn, 0, 12.5e6)} />
  </div>

const GasPriceInput = ({ initialValue, onReceiveValue, tabIndex }) => 
  <div className='txFeeOverlayGasPrice'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Gas Price (GWEI)' tabIndex={tabIndex} decimals={true} />
  </div>

const BaseFeeInput = ({ initialValue, onReceiveValue, tabIndex }) => 
  <div className='txFeeOverlayBaseFee'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Base Fee (GWEI)' tabIndex={tabIndex} decimals={true} />
  </div>

const PriorityFeeInput = ({ initialValue, onReceiveValue, tabIndex }) => 
  <div className='txFeeOverlayPriorityFee'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Max Priority Fee (GWEI)' tabIndex={tabIndex} decimals={true} />
  </div>

const PriceInput = ({ gasPriceBN, maxTotalFeeBN, gasLimitBN, handlerId }) => {
  const displayGasPrice = toDisplayFromWei(gasPriceBN)
  const gasPriceReceiveValueHandler = (newGasPriceBN) => {
    if (gweiToWei(newGasPriceBN).times(gasLimitBN).gt(maxTotalFeeBN)) {
      newGasPriceBN = maxTotalFeeBN.div(gasLimitBN).div(1e9).decimalPlaces(0, BigNumber.ROUND_FLOOR)
    }
    link.rpc('setGasPrice', gweiToWeiHex(newGasPriceBN), handlerId, (e) => {
      if (e) console.error(e)
    })
  }

  return <GasPriceInput initialValue={displayGasPrice} onReceiveValue={gasPriceReceiveValueHandler} tabIndex={0} />
}

const FeeInputs = ({ baseFeeBN, priorityFeeBN, maxTotalFeeBN, gasLimitBN, handlerId, tabIndex }) => {
  const displayPriorityFee = toDisplayFromWei(priorityFeeBN)
  const displayBaseFee = toDisplayFromWei(baseFeeBN)

  const priorityFeeReceiveValueHandler = (newPriorityFeeBN) => {
    if (gweiToWei(baseFeeBN.plus(newPriorityFeeBN)).times(gasLimitBN).gt(maxTotalFeeBN)) {
      newPriorityFeeBN = maxTotalFeeBN.div(gasLimitBN).div(1e9).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(baseFeeBN)
    }
    link.rpc('setPriorityFee', gweiToWeiHex(newPriorityFeeBN), handlerId, (e) => {
      if (e) console.error(e)
    })
  }
  const baseFeeReceiveValueHandler = (newBaseFeeBN) => {
    if (gweiToWei(newBaseFeeBN.plus(priorityFeeBN)).times(gasLimitBN).gt(maxTotalFeeBN)) {
      newBaseFeeBN = maxTotalFeeBN.div(gasLimitBN).div(1e9).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(priorityFeeBN)
    }
    link.rpc('setBaseFee', gweiToWeiHex(newBaseFeeBN), handlerId, (e) => {
      if (e) console.error(e)
    })
  }

  return <>
    <BaseFeeInput initialValue={displayBaseFee} onReceiveValue={baseFeeReceiveValueHandler} tabIndex={tabIndex} />
    <PriorityFeeInput initialValue={displayPriorityFee} onReceiveValue={priorityFeeReceiveValueHandler} tabIndex={tabIndex + 1} />
  </>
}

const LimitInput = ({ gasPriceBN, baseFeeBN, priorityFeeBN, gasLimitBN, maxTotalFeeBN, handlerId, tabIndex }) => {
  const gasLimitReceiveValueHandler = (newGasLimitBN) => {
    if (gasPriceBN && gweiToWei(gasPriceBN).times(newGasLimitBN).gt(maxTotalFeeBN)) {
      newGasLimitBN = maxTotalFeeBN.div(gweiToWei(gasPriceBN)).decimalPlaces(0, BigNumber.ROUND_FLOOR)
    } else if (gweiToWei(baseFeeBN.plus(priorityFeeBN)).times(newGasLimitBN).gt(maxTotalFeeBN)) {
      newGasLimitBN = maxTotalFeeBN.div(gweiToWei(baseFeeBN.plus(priorityFeeBN))).decimalPlaces(0, BigNumber.ROUND_FLOOR)
    }

    link.rpc('setGasLimit', newGasLimitBN.toString(), handlerId, (e) => {
      if (e) console.error(e)
    })
  }

  return <GasLimitInput initialValue={gasLimitBN.toString()} onReceiveValue={gasLimitReceiveValueHandler} tabIndex={tabIndex} />
}

class TxFeeOverlay extends Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
  }

  render () {
    const { req: { data, handlerId } } = this.props
    const gasLimit = BigNumber(data.gasLimit, 16)
    const priorityFee = BigNumber(data.maxPriorityFeePerGas, 16)
    const maxFee = BigNumber(data.maxFeePerGas, 16)
    const gasPrice = BigNumber(data.gasPrice, 16)
    const baseFee = maxFee.minus(priorityFee)
    const maxTotalFee = BigNumber(getMaxTotalFee(data))

    console.log(data)

    return (
      <div className='txAdjustFee cardShow' ref={this.moduleRef}>
        {usesBaseFee(data)
          ? <FeeInputs priorityFee={priorityFee} baseFee={baseFee} gasLimit={gasLimit} maxTotalFee={maxTotalFee} handlerId={handlerId} tabIndex={0} /> 
          : <PriceInput gasPrice={gasPrice} gasLimit={gasLimit} maxTotalFee={maxTotalFee} handlerId={handlerId} tabIndex={0} />}
        <LimitInput gasPrice={gasPrice} gasLimit={gasLimit} priorityFee={priorityFee} baseFee={baseFee} maxTotalFee={maxTotalFee} handlerId={handlerId} tabIndex={2} />
      </div>
    )
  }
}

export default Restore.connect(TxFeeOverlay)
