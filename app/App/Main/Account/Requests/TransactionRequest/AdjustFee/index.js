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

const defaultLimiter = (bn) => trimGwei(limitRange(bn))

const FeeOverlayInput = ({ initialValue, labelText, tabIndex, decimals, onReceiveValue, limiter = defaultLimiter }) => {
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

    const gasLimitReceiveValueHandler = (newGasLimit) => {
      const { baseFee, priorityFee, gasPrice } = this.state
      // TODO: test the below calculations
      // if total fee > maximum allowed fee we recalculate the gas limit based on the maximum allowed
      if (gasPrice && totalFee({ gasPrice, gasLimit: newGasLimit }).gt(maxTotalFee)) {
        console.log('gas limit clobbered 1')
        newGasLimit = maxTotalFee.div(gasPrice).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      } else if (totalFee({ baseFee, priorityFee, gasLimit: newGasLimit }).gt(maxTotalFee)) {
        console.log('gas limit clobbered 2', baseFee.toString(), priorityFee.toString())
        newGasLimit = maxTotalFee.div(baseFee.plus(priorityFee)).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }
  
      console.log('sending gas limit', newGasLimit.toString())
      this.state.gasLimit = newGasLimit.toString()
      link.rpc('setGasLimit', this.state.gasLimit, handlerId, (e) => {
        if (e) console.error(e)
      })
    }

    const displayPriorityFee = toDisplayFromWei(priorityFee)
    const displayBaseFee = toDisplayFromWei(baseFee)
  
    const priorityFeeReceiveValueHandler = (newPriorityFee) => {
      const { baseFee, gasLimit } = this.state
      // TODO: test the below calculation
      // if total fee > maximum allowed fee we recalculate the priority fee based on the maximum allowed
      if (totalFee({ baseFee, priorityFee: newPriorityFee, gasLimit }).gt(maxTotalFee)) {
        console.log('priority fee clobbered')
        newPriorityFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(baseFee)
      }
  
      console.log('sending priority fee', newPriorityFee.toString())
      this.state.priorityFee = bnToHex(newPriorityFee)
      link.rpc('setPriorityFee', this.state.priorityFee, handlerId, (e) => {
        if (e) console.error(e)
      })
    }
    const baseFeeReceiveValueHandler = (newBaseFee) => {
      const { priorityFee, gasLimit } = this.state
      // TODO: test the below calculation
      // if total fee > maximum allowed fee we recalculate the base fee based on the maximum allowed
      console.log('testing clobber', newBaseFee.toString(), priorityFee.toString(), gasLimit.toString(), totalFee({ baseFee: newBaseFee, priorityFee, gasLimit }).div(1e18).toString(), maxTotalFee.div(1e18).toString())
      if (totalFee({ baseFee: newBaseFee, priorityFee, gasLimit }).gt(maxTotalFee)) {
        console.log('base fee clobbered')
        newBaseFee = maxTotalFee.div(gasLimit).decimalPlaces(0, BigNumber.ROUND_FLOOR).minus(priorityFee)
      }
  
      console.log('sending base fee', newBaseFee.toString())
      this.state.baseFee = bnToHex(newBaseFee)
      link.rpc('setBaseFee', this.state.baseFee, handlerId, (e) => {
        if (e) console.error(e)
      })
    }

    const displayGasPrice = toDisplayFromWei(gasPrice)
    const gasPriceReceiveValueHandler = (newGasPrice) => {
      const { gasLimit } = this.state
      // TODO: test & explain the below calculation
      // if total fee > maximum allowed fee we recalculate the gas price based on the maximum allowed
      if (totalFee({ gasPrice: newGasPrice, gasLimit }).gt(maxTotalFee)) {
        console.log('gas price clobbered')
        newGasPrice = maxTotalFee.div(gasLimit).div(1e9).decimalPlaces(0, BigNumber.ROUND_FLOOR)
      }
  
      console.log('sending gas price', newGasPrice.toString())
      this.state.gasPrice = bnToHex(newGasPrice)
      link.rpc('setGasPrice', this.state.gasPrice, handlerId, (e) => {
        if (e) console.error(e)
      })
    }

    const displayGasLimit = gasLimit.toString()

    return (
      <div className='txAdjustFee cardShow' ref={this.moduleRef}>
        {usesBaseFee(data)
          ? <>
              <BaseFeeInput initialValue={(displayBaseFee)} onReceiveValue={baseFeeReceiveValueHandler} tabIndex={0} />
              <PriorityFeeInput initialValue={displayPriorityFee} onReceiveValue={priorityFeeReceiveValueHandler} tabIndex={1} />
            </> 
          : <GasPriceInput initialValue={displayGasPrice} onReceiveValue={gasPriceReceiveValueHandler} tabIndex={0} />}
        <GasLimitInput initialValue={displayGasLimit} onReceiveValue={gasLimitReceiveValueHandler} tabIndex={2} />
      </div>
    )
  }
}

export default Restore.connect(TxFeeOverlay)
