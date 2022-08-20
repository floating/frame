import React, { Component, useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../../resources/link'
import { gweiToWei, gweiToWeiHex, intToHex } from '../../../../../../../resources/utils'
import { usesBaseFee } from '../../../../../../../resources/domain/transaction'

function toDisplayFromWei (bn) {
  return bn.shiftedBy(-9).toFixed(9).toString().replace(/0+$/, '').replace(/\.+$/, '')
}

function toDisplayFromGwei (bn) {
  return bn.toFixed(9).toString().replace(/0+$/, '').replace(/\.+$/, '')
}

function trimGwei (gwei) {
  return parseFloat(parseFloat(gwei).toFixed(9)).toString()
}

function limitRange (num, min = 0, max = 9999) {
  if (num > max) return max
  if (num < min) return min
  return num
}

function formatForInput (num, decimals) {
  return decimals ? toDisplayFromGwei(BigNumber(num)) : num.toString()
}

function maxFee (tx = { chainId: '' }) {
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

const FeeOverlayInput = ({ initialValue, labelText, tabIndex, decimals, onReceiveValue }) => {
  const [value, setValue] = useState(initialValue)
  const [submitTimeout, setSubmitTimeout] = useState(0)
  const processValue = (newValue) => {
    onReceiveValue(newValue)
    setValue(formatForInput(newValue, decimals))
  }
  const set = (newValue) => {
    setValue(formatForInput(newValue, decimals))
    clearTimeout(submitTimeout)

    setSubmitTimeout(
      setTimeout(() => processValue(newValue), 500)
    )
  }

  return (
    <>
      <div className='txFeeOverlayInput'>
        <input 
          tabIndex={tabIndex} 
          value={value}
          className='txFeeOverlayInput' 
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

              const parsedValue = decimals ? parseFloat(value[0]) : parseInt(value[0])
              if (isNaN(parsedValue)) {
                return
              }

              set(parsedValue)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              const parsedValue = decimals ? parseFloat(value) : parseInt(value)
              if (isNaN(parsedValue)) {
                return
              }

              if (e.key === 'ArrowUp') {
                const incrementedValue = decimals ? limitRange(Math.floor(parsedValue) + 1) : (parsedValue + 1000)
                set(incrementedValue)
              } else {
                const decrementedValue = decimals ? limitRange(Math.floor(parsedValue) - 1) : (parsedValue - 1000)
                set(decrementedValue)
              }
            }
          }}
        />
        </div>
        <div className='txFeeOverlayLabel'>{labelText}</div>
      </>
    )
}

const GasLimitInput = ({ initialValue, maxTotalFee, baseFee, priorityFee, gasPrice, handlerId }) => {
  const receiveValueHandler = (newValue) => {
    let gasLimit = limitRange(newValue, 0, 12.5e6)
    if (gasPrice && gweiToWei(gasPrice) * gasLimit > maxTotalFee) {
      gasLimit = Math.floor(maxTotalFee / gweiToWei(gasPrice))
    } else if (gweiToWei(baseFee + priorityFee) * newValue > maxTotalFee) {
      gasLimit = Math.floor(maxTotalFee / gweiToWei(baseFee + priorityFee))
    }

    link.rpc('setGasLimit', intToHex(gasLimit), handlerId, (e) => {
      if (e) console.error(e)
    })
  }

  return (
    <div className='txFeeOverlayLimit'>
      <FeeOverlayInput initialValue={initialValue} onReceiveValue={receiveValueHandler} labelText='Gas Limit (UNITS)' tabIndex={2} decimals={false} />
    </div>
  )
}

const GasPriceInput = ({ initialValue, maxTotalFee, gasLimit, handlerId }) => {
  const receiveValueHandler = (newValue) => {
    let gasPrice = limitRange(newValue)

    if (gweiToWei(gasPrice) * gasLimit > maxTotalFee) {
      gasPrice = Math.floor(maxTotalFee / gasLimit / 1e9)
    }
    link.rpc('setGasPrice', gweiToWeiHex(gasPrice), handlerId, (e) => {
      if (e) console.error(e)
    })
  }
  return (
    <div className='txFeeOverlayGasPrice'>
      <FeeOverlayInput initialValue={initialValue} onReceiveValue={receiveValueHandler} labelText='Gas Price (GWEI)' tabIndex={0} decimals={true} />
    </div>
  )
}

const BaseFeeInput = ({ initialValue, maxTotalFee, priorityFee, gasLimit, handlerId }) => {
  const receiveValueHandler = (newValue) => {
    let baseFee = trimGwei(limitRange(newValue))
    
    if (gweiToWei(baseFee + priorityFee) * gasLimit > maxTotalFee) {
      baseFee = Math.floor(maxTotalFee / gasLimit / 1e9) - priorityFee
      console.log('recalculating baseFee')
    }
    link.rpc('setBaseFee', gweiToWeiHex(baseFee), handlerId, (e) => {
      if (e) console.error(e)
    })
  }
  return (
    <div className='txFeeOverlayBaseFee'>
      <FeeOverlayInput initialValue={initialValue} onReceiveValue={receiveValueHandler} labelText='Base Fee (GWEI)' tabIndex={0} decimals={true} />
    </div>
  )
}

const PriorityFeeInput = ({ initialValue, maxTotalFee, baseFee, gasLimit, handlerId }) => {
  const receiveValueHandler = (newValue) => {
    let priorityFee = trimGwei(limitRange(newValue))

    if (gweiToWei(baseFee + priorityFee) * gasLimit > maxTotalFee) {
      console.log('recalculating priority fee')
      priorityFee = Math.floor(maxTotalFee / gasLimit / 1e9) - baseFee
    }
    link.rpc('setPriorityFee', gweiToWeiHex(priorityFee), handlerId, (e) => {
      if (e) console.error(e)
    })
  }
  return (
    <div className='txFeeOverlayPriorityFee'>
      <FeeOverlayInput initialValue={initialValue} onReceiveValue={receiveValueHandler} labelText='Max Priority Fee (GWEI)' tabIndex={1} decimals={true} />
    </div>
  )
}

class TxFeeOverlay extends Component {
  constructor (props, context) {
    super(props, context)

    this.moduleRef = React.createRef()

    this.state = {
      copiedData: false
    }

    if (usesBaseFee(props.req.data)) {
      const prioFee = BigNumber(props.req.data.maxPriorityFeePerGas, 16)
      const maxFee = BigNumber(props.req.data.maxFeePerGas, 16)
      const baseFee = maxFee.minus(prioFee)

      this.state.priorityFee = trimGwei(toDisplayFromWei(prioFee))
      this.state.maxFee = toDisplayFromWei(maxFee)
      this.state.baseFee = trimGwei(toDisplayFromWei(baseFee))
    } else {
      const gasPrice = BigNumber(props.req.data.gasPrice, 16)
      this.state.gasPrice = toDisplayFromWei(gasPrice)
    }

    this.state.gasLimit = BigNumber(props.req.data.gasLimit, 16).toString()
  }

  copyData (data) {
    if (data) {
      link.send('tray:clipboardData', data)
      this.setState({ copiedData: true })
      setTimeout(() => this.setState({ copiedData: false }), 1000)
    }
  }

  render () {
    const { req: { data, handlerId } } = this.props
    const maxTotalFee = maxFee(data)

    return (
      <div className='txAdjustFee cardShow' ref={this.moduleRef}>
        {
          usesBaseFee(data) ? 
          <>
            <BaseFeeInput initialValue={this.state.baseFee} maxTotalFee={maxTotalFee} priorityFee={this.state.priorityFee} gasLimit={this.state.gasLimit} handlerId={handlerId} />
            <PriorityFeeInput initialValue={this.state.priorityFee} maxTotalFee={maxTotalFee} baseFee={this.state.baseFee} gasLimit={this.state.gasLimit} handlerId={handlerId} />
          </> :  
          <GasPriceInput initialValue={this.state.gasPrice} maxTotalFee={maxTotalFee} gasLimit={this.state.gasLimit} handlerId={handlerId} />
        }
        
        <GasLimitInput initialValue={this.state.gasLimit} maxTotalFee={maxTotalFee} baseFee={this.state.baseFee} priorityFee={this.state.priorityFee} gasPrice={this.state.gasPrice} handlerId={handlerId} />
      </div>
    )
  }
}

export default Restore.connect(TxFeeOverlay)
