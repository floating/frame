import React, { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../resources/link'
import { usesBaseFee } from '../../../../../../resources/domain/transaction'
import { getMaxTotalFee } from '../../../../../../resources/gas'

const numberFormat = { groupSeparator: '', decimalSeparator: '.' }

function toDisplayFromWei(bn) {
  return bn.shiftedBy(-9).decimalPlaces(9).toFormat(numberFormat)
}

function toDisplayFromGwei(bn) {
  return bn.decimalPlaces(9).toFormat(numberFormat)
}

function trimGwei(bn) {
  return BigNumber(bn.toFixed(9))
}

function gweiToWei(bn) {
  return bn.times(1e9)
}

function bnToHex(bn) {
  return `0x${bn.toString(16)}`
}

function limitRange(bn, min = 0, max) {
  if (max && bn.gt(max)) return BigNumber(max)
  if (bn.lt(min)) return BigNumber(min)
  return bn
}

function formatForInput(num, decimals, useWei = false) {
  if (!decimals) {
    return num.toString()
  }
  return useWei ? toDisplayFromWei(BigNumber(num)) : toDisplayFromGwei(BigNumber(num))
}

const totalFee = ({ gasPrice, baseFee, priorityFee, gasLimit }) =>
  gasPrice ? gasPrice.times(gasLimit) : baseFee.plus(priorityFee).times(gasLimit)

const limitGasUnits = (bn) => limitRange(bn, 0)

let submitTimeout = null

const FeeOverlayInput = ({ initialValue, labelText, tabIndex, decimals, onReceiveValue, limiter }) => {
  const [value, setValue] = useState(initialValue)
  const labelId = `txFeeOverlayLabel_${tabIndex}`

  const submitValue = (newValueStr, newValue) => {
    setValue(newValueStr)

    clearTimeout(submitTimeout)

    submitTimeout = setTimeout(() => {
      const limitedValue = limiter(decimals ? gweiToWei(trimGwei(newValue)) : newValue)
      onReceiveValue(limitedValue)
      setValue(formatForInput(limitedValue, decimals, true))
    }, 500)
  }

  return (
    <>
      <div className='txFeeOverlayInput'>
        <input
          tabIndex={tabIndex}
          value={value}
          className='txFeeOverlayInput'
          aria-labelledby={labelId}
          onChange={(e) => {
            const parsedInput = (decimals ? /[0-9.]*/ : /[0-9]*/).exec(e.target.value)
            const enteredValue = parsedInput[0] || ''

            if (enteredValue === '.' || enteredValue === '') return setValue(enteredValue)

            const numericValue = BigNumber(e.target.value)
            if (numericValue.isNaN()) return

            clearTimeout(submitTimeout)

            // prevent decimal point being overwritten as user is typing a float
            if (enteredValue.endsWith('.')) {
              const formattedNum = formatForInput(enteredValue.slice(0, -1), decimals)

              return setValue(`${formattedNum}.`)
            }

            submitValue(enteredValue, numericValue)
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
                newValue = decimals
                  ? parsedValue.decimalPlaces(9, BigNumber.ROUND_FLOOR).plus(1)
                  : parsedValue.plus(1000)
              } else {
                newValue = decimals
                  ? parsedValue.decimalPlaces(9, BigNumber.ROUND_FLOOR).minus(1)
                  : parsedValue.minus(1000)
              }
              const limitedValue = limiter(newValue)
              submitValue(limitedValue.toString(), limitedValue)
            }
          }}
        />
      </div>
      <div id={labelId} className='txFeeOverlayLabel'>
        {labelText}
      </div>
    </>
  )
}

const GasLimitInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => (
  <div className='txFeeOverlayLimit'>
    <FeeOverlayInput
      initialValue={initialValue}
      onReceiveValue={onReceiveValue}
      labelText='Gas Limit (UNITS)'
      tabIndex={tabIndex}
      decimals={false}
      limiter={limiter}
    />
  </div>
)

const GasPriceInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => (
  <div className='txFeeOverlayGasPrice'>
    <FeeOverlayInput
      initialValue={initialValue}
      onReceiveValue={onReceiveValue}
      labelText='Gas Price (GWEI)'
      tabIndex={tabIndex}
      decimals={true}
      limiter={limiter}
    />
  </div>
)

const BaseFeeInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => (
  <div className='txFeeOverlayBaseFee'>
    <FeeOverlayInput
      initialValue={initialValue}
      onReceiveValue={onReceiveValue}
      labelText='Base Fee (GWEI)'
      tabIndex={tabIndex}
      decimals={true}
      limiter={limiter}
    />
  </div>
)

const PriorityFeeInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => (
  <div className='txFeeOverlayPriorityFee'>
    <FeeOverlayInput
      initialValue={initialValue}
      onReceiveValue={onReceiveValue}
      labelText='Max Priority Fee (GWEI)'
      tabIndex={tabIndex}
      decimals={true}
      limiter={limiter}
    />
  </div>
)

class TxFeeOverlay extends Component {
  constructor(props, context) {
    super(props, context)
    const {
      req: {
        data: { gasLimit, maxPriorityFeePerGas, maxFeePerGas, gasPrice }
      }
    } = props
    this.moduleRef = React.createRef()
    const maxFee = BigNumber(maxFeePerGas, 16)
    const priorityFee = BigNumber(maxPriorityFeePerGas, 16)
    this.state = {
      gasLimit: BigNumber(gasLimit, 16),
      gasPrice: BigNumber(gasPrice, 16),
      baseFee: maxFee.minus(priorityFee),
      priorityFee
    }
  }

  render() {
    const {
      req: { data, handlerId }
    } = this.props
    const { baseFee, gasLimit, priorityFee, gasPrice } = this.state
    const maxTotalFee = BigNumber(getMaxTotalFee(data))

    const displayBaseFee = toDisplayFromWei(baseFee)
    const baseFeeLimiter = (rawBaseFee) => {
      const { priorityFee, gasLimit } = this.state
      // if total fee > maximum allowed fee we recalculate the base fee based on the maximum allowed
      if (totalFee({ baseFee: rawBaseFee, priorityFee, gasLimit }).gt(maxTotalFee)) {
        rawBaseFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(priorityFee)
      }

      return limitRange(rawBaseFee)
    }

    const displayPriorityFee = toDisplayFromWei(priorityFee)
    const priorityFeeLimiter = (rawPriorityFee) => {
      const { baseFee, gasLimit } = this.state
      // if total fee > maximum allowed fee we recalculate the priority fee based on the maximum allowed
      if (totalFee({ baseFee, priorityFee: rawPriorityFee, gasLimit }).gt(maxTotalFee)) {
        rawPriorityFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(baseFee)
      }

      return limitRange(rawPriorityFee)
    }

    const displayGasPrice = toDisplayFromWei(gasPrice)
    const gasPriceLimiter = (rawGasPrice) => {
      const { gasLimit } = this.state
      // if total fee > maximum allowed fee we recalculate the gas price based on the maximum allowed
      if (totalFee({ gasPrice: rawGasPrice, gasLimit }).gt(maxTotalFee)) {
        rawGasPrice = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }

      return limitRange(rawGasPrice)
    }

    const displayGasLimit = gasLimit.toString()
    const gasLimitLimiter = (rawGasLimit) => {
      const { baseFee, priorityFee, gasPrice } = this.state
      // if total fee > maximum allowed fee we recalculate the gas limit based on the maximum allowed
      if (gasPrice && totalFee({ gasPrice, gasLimit: rawGasLimit }).gt(maxTotalFee)) {
        rawGasLimit = maxTotalFee.div(gasPrice).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      } else if (totalFee({ baseFee, priorityFee, gasLimit: rawGasLimit }).gt(maxTotalFee)) {
        rawGasLimit = maxTotalFee.div(baseFee.plus(priorityFee)).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }

      return limitGasUnits(rawGasLimit)
    }

    const receiveValueHandler = (value, name) => {
      this.setState({
        [name]: value
      })

      link.rpc(`set${name.charAt(0).toUpperCase() + name.slice(1)}`, bnToHex(value), handlerId, (e) => {
        if (e) console.error(e)
      })
    }

    return (
      <div className='txAdjustFee cardShow' ref={this.moduleRef}>
        {usesBaseFee(data) ? (
          <>
            <BaseFeeInput
              initialValue={displayBaseFee}
              onReceiveValue={(value) => receiveValueHandler(value, 'baseFee')}
              limiter={baseFeeLimiter}
              tabIndex={0}
            />
            <PriorityFeeInput
              initialValue={displayPriorityFee}
              onReceiveValue={(value) => receiveValueHandler(value, 'priorityFee')}
              limiter={priorityFeeLimiter}
              tabIndex={1}
            />
          </>
        ) : (
          <GasPriceInput
            initialValue={displayGasPrice}
            onReceiveValue={(value) => receiveValueHandler(value, 'gasPrice')}
            limiter={gasPriceLimiter}
            tabIndex={0}
          />
        )}
        <GasLimitInput
          initialValue={displayGasLimit}
          onReceiveValue={(value) => receiveValueHandler(value, 'gasLimit')}
          limiter={gasLimitLimiter}
          tabIndex={2}
        />
      </div>
    )
  }
}

export default Restore.connect(TxFeeOverlay)
