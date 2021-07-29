import React from 'react'
import Restore from 'react-restore'
// import utils from 'web3-utils'

import svg from '../../../../../../../../../resources/svg'
import link from '../../../../../../../../../resources/link'
import { gweiToWei, gweiToWeiHex } from '../../../../../../../../../resources/utils'

import BigNumber from 'bignumber.js'


//  <div className='txModuleTop'>
// <div className={'txModuleTopData txModuleTopDataExpanded'}>
  // <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
  // <div className='transactionDataLabel'>View Data</div>
  // <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
    // {svg.octicon('clippy', { height: 20 })}
  // </div>
// </div> 
// <div className='txModuleBody'>

const FEE_MAX_TOTAL_ETH_WEI = 2 * 1e18

class TxFeeOverlay extends React.Component {
  constructor (props, context) {
    super(props, context)

    this.moduleRef = React.createRef()

    this.state = {
      copiedData: false
    }

    if (props.req.data.type === '0x2') {
      const prioFee = BigNumber(props.req.data.maxPriorityFeePerGas, 16)
      const maxFee = BigNumber(props.req.data.maxFeePerGas, 16)
      const baseFee = maxFee.minus(prioFee)

      this.state.priorityFee = this.toDisplayFullGwei(prioFee)
      this.state.maxFee = this.toDisplayFullGwei(maxFee)
      this.state.baseFee = this.toDisplayFullGwei(baseFee)
    } else {
      const gasPrice = BigNumber(props.req.data.gasPrice, 16)
      this.state.gasPrice = this.toDisplayFullGwei(gasPrice)
    }

    this.state.gasLimit = BigNumber(props.req.data.gasLimit, 16).toString()
  }

  mouseDetect (e) {
    if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
      this.props.overlayMode()
    }
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.mouseDetect.bind(this))
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.mouseDetect.bind(this))
  }

  copyData (data) {
    if (data) {
      link.send('tray:clipboardData', data)
      this.setState({ copiedData: true })
      setTimeout(_ => this.setState({ copiedData: false }), 1000)
    }
  }

  toDisplayEther (bn) {
    return parseFloat(bn.shiftedBy(-18).toFixed(6).toString())
  }

  toDisplayFullGwei (bn) {
    return bn.shiftedBy(-9).toFixed(9).toString().replace(/0+$/,'').replace(/\.+$/,'')
  }

  trimGwei (gwei) {
    return parseFloat(parseFloat(gwei).toFixed(6))
  }

  setBaseFee (baseFee) {
    this.setState({ baseFee })
    clearTimeout(this.baseFeeSubmitTimeout)
    this.baseFeeSubmitTimeout = setTimeout(() => {
      baseFee = parseFloat(baseFee)
      if (isNaN(baseFee)) return
      baseFee = this.limitRange(baseFee, 0, 9999)
      const priorityFee = parseFloat(this.state.priorityFee)
      const gasLimit = parseInt(this.state.gasLimit)
      if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        baseFee = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9) - priorityFee
      }
      link.rpc('setBaseFee', gweiToWeiHex(baseFee), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      baseFee = baseFee.toString()
      this.setState({ baseFee })
    }, 500)
  }

  setPriorityFee (priorityFee) {
    this.setState({ priorityFee })
    clearTimeout(this.priorityFeeSubmitTimeout)
    this.priorityFeeSubmitTimeout = setTimeout(() => {
      priorityFee = parseFloat(priorityFee)
      if (isNaN(priorityFee)) return
      priorityFee = this.limitRange(priorityFee, 0, 9999)
      const baseFee = parseFloat(this.state.baseFee)
      const gasLimit = parseInt(this.state.gasLimit)
      if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        priorityFee = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9) - baseFee
      }
      link.rpc('setPriorityFee', gweiToWeiHex(priorityFee), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      priorityFee = priorityFee.toString()
      this.setState({ priorityFee })
    }, 500)
  }

  setGasPrice (gasPrice) {
    this.setState({ gasPrice })
    clearTimeout(this.gasPriceSubmitTimeout)
    this.gasPriceSubmitTimeout = setTimeout(() => {
      gasPrice = parseFloat(gasPrice)
      if (isNaN(gasPrice)) return
      gasPrice = this.limitRange(gasPrice, 0, 9999)
      const gasLimit = parseInt(this.state.gasLimit)
      if (gweiToWei(gasPrice) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        gasPrice = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9)
      }
      link.rpc('setGasPrice', gweiToWeiHex(gasPrice), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      gasPrice = gasPrice.toString()
      this.setState({ gasPrice })
    }, 500)
  }

  setGasLimit (gasLimit) {
    this.setState({ gasLimit })
    clearTimeout(this.gasLimitSubmitTimeout)
    this.gasLimitSubmitTimeout = setTimeout(() => {
      gasLimit = parseInt(gasLimit)
      if (isNaN(gasLimit)) return
      if (gasLimit  > 12.5e6) gasLimit = 12.5e6
      if (this.props.req.data.type === '0x2') {
        const baseFee = parseFloat(this.state.baseFee)
        const priorityFee = parseFloat(this.state.priorityFee)
        if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
          gasLimit = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gweiToWei(baseFee + priorityFee))
        }
      } else {
        const gasPrice = parseFloat(this.state.gasPrice)
        if (gweiToWei(gasPrice) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
          gasLimit = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gweiToWei(gasPrice))
        }
      }
      link.rpc('setGasLimit', '0x' + gasLimit.toString(16), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      gasLimit.toString()
      this.setState({ gasLimit })
    }, 500)
  }

  limitRange (num, min, max) {
    if (num > max) return max
    if (num < min) return min
    return num
  }

  renderBaseFeeInput () {
    return (
      <div className='txFeeOverlayBaseFee'>
        <div className='txFeeOverlayInput'>
          <input
            tabIndex={0}
            value={this.state.baseFee}
            onChange={(e) => {
              this.setBaseFee(e.target.value.match('[0-9\.\-]*').toString())
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                let baseFee = parseFloat(this.state.baseFee)
                if (isNaN(baseFee)) return
                baseFee = this.limitRange(baseFee + 1, 0, 9999)
                baseFee = this.trimGwei(baseFee).toString()
                this.setBaseFee(baseFee)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                let baseFee = parseFloat(this.state.baseFee)
                if (isNaN(baseFee)) return
                baseFee = this.limitRange(baseFee - 1, 0, 9999)
                baseFee = this.trimGwei(baseFee).toString()
                this.setBaseFee(baseFee)
              }
            }}
          />
        </div>
        <div className='txFeeOverlayLabel'>Base Fee (GWEI)</div>
      </div>
    )
  }

  renderPriorityFeeInput () {
    return (
      <div className='txFeeOverlayPriorityFee'>
        <div className='txFeeOverlayInput'>
        <input
            tabIndex={1}
            value={this.state.priorityFee}
            onChange={(e) => {
              this.setPriorityFee(e.target.value.match('[0-9\.\-]*'))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                let priorityFee = parseFloat(this.state.priorityFee)
                if (isNaN(priorityFee)) return
                priorityFee = this.limitRange(priorityFee + 1, 0, 9999)
                priorityFee = this.trimGwei(priorityFee).toString()
                this.setPriorityFee(priorityFee)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                let priorityFee = parseFloat(this.state.priorityFee)
                if (isNaN(priorityFee)) return
                priorityFee = this.limitRange(priorityFee - 1, 0, 9999)
                priorityFee = this.trimGwei(priorityFee).toString()
                this.setPriorityFee(priorityFee)
              }
            }}
          />
        </div>
        <div className='txFeeOverlayLabel'>Priority Fee (GWEI) </div>
      </div>
    )
  }

  renderGasPriceInput () {
    return (
      <div className='txFeeOverlayBaseFee'>
        <div className='txFeeOverlayInput'>
          <input
            tabIndex={0}
            value={this.state.gasPrice}
            onChange={(e) => {
              this.setGasPrice(e.target.value.match('[0-9\.\-]*').toString())
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                const gasPrice = this.trimGwei(this.limitRange(parseFloat(this.state.gasPrice) + 1, 0, 9999))
                if (isNaN(gasPrice)) return
                this.setGasPrice(gasPrice)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                const gasPrice = this.trimGwei(this.limitRange(parseFloat(this.state.gasPrice) - 1, 0, 9999))
                if (isNaN(gasPrice)) return
                this.setGasPrice(gasPrice)
              }
            }}
          />
        </div>
        <div className='txFeeOverlayLabel'>Gas Price (GWEI)</div>
      </div>
    )
  }

  renderGasLimitInput () {
    return (
      <div className='txFeeOverlayLimit'>
        <div className='txFeeOverlayInput'>
          <input 
            tabIndex={3} 
            value={this.state.gasLimit}
            className='txFeeOverlayInput' 
            onChange={(e) => {
              this.setGasLimit(e.target.value.match('[0-9]*'))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                const gasLimit = parseInt(this.state.gasLimit) + 1000
                if (isNaN(gasLimit)) return
                this.setGasLimit(gasLimit.toString())
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                const gasLimit = parseInt(this.state.gasLimit) - 1000
                if (isNaN(gasLimit)) return
                this.setGasLimit(gasLimit.toString())
              }
            }}
          />
        </div>
        <div className='txFeeOverlayLabel'>Gas Limit (UNITS)</div>
      </div>
    )
  }

  render () {
    const { req, overlayMode } = this.props
    if (req.data.type === '0x2') {  
      // const baseFee = BigNumber(this.state.maxFeePerGas, 16)
      // const priorityFee = BigNumber(req.data.maxPriorityFeePerGas, 16)
      // const gasLimit = BigNumber(req.data.gasLimit, 16)
      // maxFeePerGas = baseFee.plus(priorityFee)
      // maxFee = maxFeePerGas.multipliedBy(gasLimit)
      // maxFeeUSD = maxFee.multipliedBy(nativeUSD)
      return (
        <div className='txOverlay cardShow' ref={this.moduleRef}>
          <div className='txOverlayTitle'>Adjust Fee</div>
          <div className='txOverlayClose' onMouseDown={() => overlayMode()}>{svg.octicon('x', { height: 16 })}</div>
          <div className='txFeeOverlay'>
            <div className='txFeeOverlayInset'>
              <div className='txFeeOverlayEstimate'></div>
              {this.renderBaseFeeInput()}
              {this.renderPriorityFeeInput()}
              {this.renderGasLimitInput()}
            </div>
          </div>
        </div>
      )
    } else {
      // const gasLimit = BigNumber(req.data.gasLimit, 16)
      // maxFeePerGas = BigNumber(req.data.gasPrice, 16)
      // maxFee = maxFeePerGas.multipliedBy(gasLimit)
      // maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
      return (
        <div className='txOverlay cardShow' ref={this.moduleRef}>
          <div className='txOverlayTitle'>Adjust Fee</div>
          <div className='txOverlayClose' onMouseDown={() => overlayMode()}>{svg.octicon('x', { height: 16 })}</div>
          <div className='txFeeOverlay'>
            <div className='txFeeOverlayInset'>
              <div className='txFeeOverlayEstimate'></div>
              {this.renderGasPriceInput()}
              {this.renderGasLimitInput()}
            </div>
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(TxFeeOverlay)
