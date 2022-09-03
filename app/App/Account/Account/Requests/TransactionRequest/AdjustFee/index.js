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

function bnToHex (bn) {
  return `0x${bn.toString(16)}`
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

const totalFee = ({ gasPrice, baseFee, priorityFee, gasLimit }) => gasPrice ? gasPrice.times(gasLimit) : baseFee.plus(priorityFee).times(gasLimit)

const limitGwei = (bn) => trimGwei(limitRange(bn))
const limitGasUnits = (bn) => limitRange(bn, 0, 12.5e6)

const FeeOverlayInput = ({ initialValue, labelText, tabIndex, decimals, onReceiveValue, limiter }) => {
  const [value, setValue] = useState(initialValue)
  const [submitTimeout, setSubmitTimeout] = useState(0)
  const submitValue = (newValueStr, newValue) => {
    setValue(newValueStr)
    clearTimeout(submitTimeout)

    setSubmitTimeout(
      setTimeout(() => {
        const limitedValue = limiter(newValue)
        onReceiveValue(decimals ? gweiToWei(limitedValue) : limitedValue)
        setValue(formatForInput(limitedValue, decimals))
      }, 500)
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
            if (!value) {
              return
            } 

            // prevent decimal point being overwritten as user is typing a float
            if (value[0].endsWith('.')) {
              const formattedNum = formatForInput(value[0].slice(0, -1), decimals)
              setValue(`${formattedNum}.`)
              clearTimeout(submitTimeout)
              return
            }

            // allow user to delete the existing value (without submitting an empty string)  
            if (value[0] === '') {
              setValue('')
              clearTimeout(submitTimeout)
              return                
            }

            const parsedValue = BigNumber(value[0])
            if (parsedValue.isNaN()) {
              return
            }

            submitValue(value[0], parsedValue)
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

const GasLimitInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => 
  <div className='txFeeOverlayLimit'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Gas Limit (UNITS)' tabIndex={tabIndex} decimals={false} limiter={limiter} />
  </div>

const GasPriceInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => 
  <div className='txFeeOverlayGasPrice'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Gas Price (GWEI)' tabIndex={tabIndex} decimals={true} limiter={limiter} />
  </div>

const BaseFeeInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => 
  <div className='txFeeOverlayBaseFee'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Base Fee (GWEI)' tabIndex={tabIndex} decimals={true} limiter={limiter} />
  </div>

const PriorityFeeInput = ({ initialValue, onReceiveValue, tabIndex, limiter }) => 
  <div className='txFeeOverlayPriorityFee'>
    <FeeOverlayInput initialValue={initialValue} onReceiveValue={onReceiveValue} labelText='Max Priority Fee (GWEI)' tabIndex={tabIndex} decimals={true} limiter={limiter} />
  </div>

class TxFeeOverlay extends Component {
  constructor (props, context) {
    super(props, context)
    const { req: { data: { gasLimit, maxPriorityFeePerGas, maxFeePerGas, gasPrice } } } = props
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

  render () {
    const { req: { data, handlerId } } = this.props
    const { baseFee, gasLimit, priorityFee, gasPrice } = this.state
    const maxTotalFee = BigNumber(getMaxTotalFee(data))

    console.log(data)

    const displayBaseFee = toDisplayFromWei(baseFee)
    const baseFeeLimiter = (rawBaseFee) => {
      const { priorityFee, gasLimit } = this.state
      // if total fee > maximum allowed fee we recalculate the base fee based on the maximum allowed
      console.log('testing clobber', rawBaseFee.toString(), priorityFee.toString(), gasLimit.toString(), totalFee({ baseFee: rawBaseFee, priorityFee, gasLimit }).div(1e18).toString(), maxTotalFee.div(1e18).toString())
      if (totalFee({ baseFee: rawBaseFee, priorityFee, gasLimit }).gt(maxTotalFee)) {
        console.log('base fee clobbered')
        rawBaseFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(priorityFee)
      }

      return limitGwei(rawBaseFee)
    }

    const displayPriorityFee = toDisplayFromWei(priorityFee)
    const priorityFeeLimiter = (rawPriorityFee) => {
      const { baseFee, gasLimit } = this.state
      // TODO: test the below calculation
      // if total fee > maximum allowed fee we recalculate the priority fee based on the maximum allowed
      if (totalFee({ baseFee, priorityFee: rawPriorityFee, gasLimit }).gt(maxTotalFee)) {
        console.log('priority fee clobbered')
        rawPriorityFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(baseFee)
      }
  
      return limitGwei(rawPriorityFee)
    }

    const displayGasPrice = toDisplayFromWei(gasPrice)
    const gasPriceLimiter = (rawGasPrice) => {
      const { gasLimit } = this.state
      // TODO: test & explain the below calculation
      // if total fee > maximum allowed fee we recalculate the gas price based on the maximum allowed
      if (totalFee({ gasPrice: rawGasPrice, gasLimit }).gt(maxTotalFee)) {
        console.log('gas price clobbered')
        rawGasPrice = maxTotalFee.div(gasLimit).div(1e9).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }

      return limitGwei(rawGasPrice)
    }

    const displayGasLimit = gasLimit.toString()
    const gasLimitLimiter = (rawGasLimit) => {
      const { baseFee, priorityFee, gasPrice } = this.state
      // TODO: test the below calculations
      // if total fee > maximum allowed fee we recalculate the gas limit based on the maximum allowed
      if (gasPrice && totalFee({ gasPrice, gasLimit: rawGasLimit }).gt(maxTotalFee)) {
        console.log('gas limit clobbered 1')
        rawGasLimit = maxTotalFee.div(gasPrice).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      } else if (totalFee({ baseFee, priorityFee, gasLimit: rawGasLimit }).gt(maxTotalFee)) {
        console.log('gas limit clobbered 2', baseFee.toString(), priorityFee.toString())
        rawGasLimit = maxTotalFee.div(baseFee.plus(priorityFee)).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }
  
      return limitGasUnits(rawGasLimit)
    }

    const receiveValueHandler = (value, name, setAsHex = true) => {
      console.log(`sending ${name}`, value.toString())
      this.state[name] = value
      const valueToSet = setAsHex ? bnToHex(this.state[name]) : this.state[name].toString()
      link.rpc(`set${name.charAt(0).toUpperCase() + name.slice(1)}`, valueToSet, handlerId, (e) => {
        if (e) console.error(e)
      })
    }

    return (
      <div className='txAdjustFee cardShow' ref={this.moduleRef}>
        {usesBaseFee(data)
          ? <>
              <BaseFeeInput initialValue={(displayBaseFee)} onReceiveValue={(value) => receiveValueHandler(value, 'baseFee')} limiter={baseFeeLimiter} tabIndex={0} />
              <PriorityFeeInput initialValue={displayPriorityFee} onReceiveValue={(value) => receiveValueHandler(value, 'priorityFee')} limiter={priorityFeeLimiter} tabIndex={1} />
            </> 
          : <GasPriceInput initialValue={displayGasPrice} onReceiveValue={(value) => receiveValueHandler(value, 'gasPrice')} limiter={gasPriceLimiter} tabIndex={0} />}
        <GasLimitInput initialValue={displayGasLimit} onReceiveValue={(value) => receiveValueHandler(value, 'gasLimit', false)} limiter={gasLimitLimiter} tabIndex={2} />
      </div>
    )
  }
}

export default Restore.connect(TxFeeOverlay)
