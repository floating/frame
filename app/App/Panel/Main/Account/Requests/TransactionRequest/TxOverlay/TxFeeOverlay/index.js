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
      this.state.baseFee = this.toDisplayGwei(BigNumber(props.req.data.maxFeePerGas, 16))
      this.state.priorityFee = this.toDisplayGwei(BigNumber(props.req.data.maxPriorityFeePerGas, 16))
      this.state.gasLimit = BigNumber(props.req.data.gasLimit, 16)
    } else {
      this.state.gasPrice = this.toDisplayGwei(BigNumber(props.req.data.gasPrice, 16))
      this.state.gasLimit = BigNumber(props.req.data.gasLimit, 16)
    }
    
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

  toDisplayGwei (bn) {
    return parseFloat(bn.shiftedBy(-9).toFixed(4).toString())
  }

  trimGwei (gwei) {
    return parseFloat(parseFloat(gwei).toFixed(5))
  }

  checkGasMax (baseFee, priorityFee, gasLimit, test) {
    if (test === 'baseFee') {
      if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9)
        return Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9) - priorityFee
      } else {
        return baseFee
      }
    } else if (test === 'priorityFee') {
      if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9)
        return Math.floor(FEE_MAX_TOTAL_ETH_WEI / gasLimit / 1e9) - baseFee
      } else {
        return priorityFee
      }
    } else if (test === 'gasLimit') {
      if (gweiToWei(baseFee + priorityFee) * gasLimit > FEE_MAX_TOTAL_ETH_WEI) {
        return Math.floor(FEE_MAX_TOTAL_ETH_WEI / gweiToWei(baseFee + priorityFee))
      } else {
        return baseFee
      }
    }
  }

  setBaseFee (baseFee) {
    clearTimeout(this.baseFeeSubmitTimeout)
    this.baseFeeSubmitTimeout = setTimeout(() => {
      let inputGwei = this.trimGwei(this.limitRange(baseFee, 0, 9999))
      if (isNaN(inputGwei)) return
      const priorityFee = this.toDisplayGwei(BigNumber(this.props.req.data.maxPriorityFeePerGas, 16))
      const gasLimit = parseInt(this.props.req.data.gasLimit, 'hex')
      inputGwei = this.checkGasMax(inputGwei, priorityFee, gasLimit, 'baseFee')
      this.setState({ baseFee: inputGwei })
      link.rpc('setBaseFee', gweiToWeiHex(inputGwei), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
    }, 500)
  }

  setPriorityFee (priorityFee) {
    clearTimeout(this.priorityFeeSubmitTimeout)
    this.priorityFeeSubmitTimeout = setTimeout(() => {
      let inputGwei = this.trimGwei(this.limitRange(priorityFee, 0, 9999))
      if (isNaN(inputGwei)) return
      const baseFee = this.toDisplayGwei(BigNumber(this.props.req.data.maxFeePerGas, 16))
      const gasLimit = BigNumber(this.props.req.data.gasLimit, 16)
      inputGwei = this.checkGasMax(baseFee, inputGwei, gasLimit, 'priorityFee')
      this.setState({ priorityFee: inputGwei })
      link.rpc('setPriorityFee', gweiToWeiHex(inputGwei), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
    }, 500)
  }

  setGasLimit (gasLimit) {
    clearTimeout(this.gasLimitSubmitTimeout)
    this.gasLimitSubmitTimeout = setTimeout(() => {
      gasLimit = parseInt(gasLimit)
      if (isNaN(gasLimit)) return
      const baseFee = this.toDisplayGwei(BigNumber(this.props.req.data.maxFeePerGas, 16))
      const priorityFee = this.toDisplayGwei(BigNumber(this.props.req.data.maxPriorityFeePerGas, 16))
      gasLimit = this.checkGasMax(baseFee, priorityFee, gasLimit, 'gasLimit')
      this.setState({ gasLimit })
      link.rpc('setGasLimit', '0x' + gasLimit.toString(16), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
    }, 500)

  }

  limitRange (num, min, max) {
    if (num > max) return max
    if (num < min) return min
    return num
  }

  render () {
    const { req, overlayMode } = this.props
    if (req.data.type === '0x2') {
      return (
        <div className='txOverlay cardShow' ref={this.moduleRef}>
          <div className='txOverlayTitle'>Adjust Fee</div>
          <div className='txOverlayClose' onMouseDown={() => overlayMode()}>{svg.octicon('x', { height: 16 })}</div>
          <div className='txFeeOverlay'>
            <div className='txFeeOverlayInset'>
              <div className='txFeeOverlayType'>{'EIP-1559 Tx Details'}</div>
              <div className='txFeeOverlayEstimate'></div>
              <div className='txFeeOverlayBaseFee'>
                <div className='txFeeOverlayInput'>
                  <input
                    tabIndex={0}
                    value={this.state.baseFee}
                    onChange={(e) => {
                      const baseFee = e.target.value.match('[0-9\.\-]*').toString()
                      this.setState({ baseFee })
                      this.setBaseFee(baseFee)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.target.blur()
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const inputGwei = this.trimGwei(this.state.baseFee) + 1
                        if (isNaN(inputGwei)) return
                        const baseFee = this.trimGwei(this.limitRange(inputGwei, 0, 9999))
                        this.setState({ baseFee })
                        this.setBaseFee(baseFee)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const inputGwei = this.trimGwei(this.state.baseFee) - 1
                        if (isNaN(inputGwei)) return
                        const baseFee = this.trimGwei(this.limitRange(inputGwei, 0, 9999))
                        this.setState({ baseFee })
                        this.setBaseFee(baseFee)
                      }
                    }}
                  />
                </div>
                <div className='txFeeOverlayLabel'>Base Fee (GWEI)</div>
              </div>
              <div className='txFeeOverlayPriorityFee'>
                <div className='txFeeOverlayInput'>
                <input
                    tabIndex={1}
                    value={this.state.priorityFee}
                    onChange={(e) => {
                      const priorityFee = e.target.value.match('[0-9\.\-]*')
                      this.setState({ priorityFee })
                      this.setPriorityFee(priorityFee)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.target.blur()
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const inputGwei = this.trimGwei(this.state.priorityFee) + 1
                        if (isNaN(inputGwei)) return
                        const priorityFee = this.trimGwei(this.limitRange(inputGwei, 0, 9999))
                        this.setState({ priorityFee })
                        this.setPriorityFee(priorityFee)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const inputGwei = this.trimGwei(this.state.priorityFee) - 1
                        if (isNaN(inputGwei)) return
                        const priorityFee = this.trimGwei(this.limitRange(inputGwei, 0, 9999))
                        this.setState({ priorityFee })
                        this.setPriorityFee(priorityFee)
                      }
                    }}
                  />
                </div>
                <div className='txFeeOverlayLabel'>Priority Fee (GWEI) </div>
              </div>
              <div className='txFeeOverlayLimit'>
                <div className='txFeeOverlayInput'>
                  <input 
                    tabIndex={3} 
                    value={this.state.gasLimit}
                    className='txFeeOverlayInput' 
                    onChange={(e) => {
                      const gasLimit = e.target.value.match('[0-9]*')
                      this.setState({ gasLimit })
                      this.setGasLimit(gasLimit)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.target.blur()
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const inputUnits = this.state.gasLimit
                        if (isNaN(inputUnits)) return
                        const gasLimit = inputUnits + 1000
                        this.setState({ gasLimit })
                        this.setGasLimit(gasLimit)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const inputUnits = this.state.gasLimit
                        if (isNaN(inputUnits)) return
                        const gasLimit = inputUnits + 1000
                        this.setState({ gasLimit })
                        this.setGasLimit(gasLimit)
                      }
                    }}
                  />
                </div>
                <div className='txFeeOverlayLabel'>Gas Limit (UNITS)</div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      const gasPrice = BigNumber(req.data.gasPrice, 16)
      const gasLimit = BigNumber(req.data.gasLimit, 16)
      return (
        <div className='txOverlay cardShow'>
          <div className='txOverlayTitle'>Adjust Fee</div>
          <div className='txOverlayClose' onMouseDown={() => overlayMode()}>{svg.octicon('x', { height: 16 })}</div>
          <div className='txOverlayBody'>
            {'Legacy Tx Details'}
            <div className='txOverlayGasFee'>GasFee Fee: {this.toDisplayGwei(gasPrice)}</div>
            <div className='txOverlayGasLimit'>Gas Limit: {gasLimit.toString()}</div>
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(TxFeeOverlay)