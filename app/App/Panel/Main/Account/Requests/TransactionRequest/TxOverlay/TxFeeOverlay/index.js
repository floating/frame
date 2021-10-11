import React from 'react'
import Restore from 'react-restore'
// import utils from 'web3-utils'

import svg from '../../../../../../../../../resources/svg'
import link from '../../../../../../../../../resources/link'
import { gweiToWei, gweiToWeiHex } from '../../../../../../../../../resources/utils'
import { usesBaseFee } from '../../../../../../../../../main/transaction'

import BigNumber from 'bignumber.js'

function maxFee (tx = { chainId: '' }) {
  const chainId = parseInt(tx.chainId)

  // for ETH-based chains, the max fee should be 2 ETH
  if ([1, 3, 4, 5, 6, 10, 42, 61, 62, 63, 69].includes(chainId)) {
    return 2 * 1e18
  }

  // for Fantom, the max fee should be 250 FTM
  if ([250, 4002].includes(chainId)) {
    return 250 * 1e18
  }

  // for all other chains, default to 10 of the chain's currency
  return 10 * 1e18
}

//  <div className='txModuleTop'>
// <div className={'txModuleTopData txModuleTopDataExpanded'}>
  // <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
  // <div className='transactionDataLabel'>View Data</div>
  // <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
    // {svg.octicon('clippy', { height: 20 })}
  // </div>
// </div> 
// <div className='txModuleBody'>

class TxFeeOverlay extends React.Component {
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

      this.state.priorityFee = this.toDisplayFromWei(prioFee)
      this.state.maxFee = this.toDisplayFromWei(maxFee)
      this.state.baseFee = this.toDisplayFromWei(baseFee)
    } else {
      const gasPrice = BigNumber(props.req.data.gasPrice, 16)
      this.state.gasPrice = this.toDisplayFromWei(gasPrice)
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

  toDisplayFromWei (bn) {
    return bn.shiftedBy(-9).toFixed(9).toString().replace(/0+$/,'').replace(/\.+$/,'')
  }

  toDisplayFromGwei (bn) {
    return bn.toFixed(9).toString().replace(/0+$/,'').replace(/\.+$/,'')
  }

  trimGwei (gwei) {
    return parseFloat(parseFloat(gwei).toFixed(3)).toString()
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
      const maxTotalFee = maxFee(this.props.req.data)
      
      if (gweiToWei(baseFee + priorityFee) * gasLimit > maxTotalFee) {
        baseFee = Math.floor(maxTotalFee / gasLimit / 1e9) - priorityFee
      }
      link.rpc('setBaseFee', gweiToWeiHex(baseFee), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      this.setState({ baseFee: this.toDisplayFromGwei(BigNumber(baseFee)) })
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
      const maxTotalFee = maxFee(this.props.req.data)

      if (gweiToWei(baseFee + priorityFee) * gasLimit > maxTotalFee) {
        priorityFee = Math.floor(maxTotalFee / gasLimit / 1e9) - baseFee
      }
      link.rpc('setPriorityFee', gweiToWeiHex(priorityFee), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      if (this.toDisplayFromGwei(BigNumber(priorityFee)) !== this.toDisplayFromGwei(BigNumber(this.state.priorityFee))) {
        this.setState({ priorityFee: this.toDisplayFromGwei(BigNumber(priorityFee)) })
      }
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
      const maxTotalFee = maxFee(this.props.req.data)

      if (gweiToWei(gasPrice) * gasLimit > maxTotalFee) {
        gasPrice = Math.floor(maxTotalFee / gasLimit / 1e9)
      }
      link.rpc('setGasPrice', gweiToWeiHex(gasPrice), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      this.setState({ gasPrice: this.toDisplayFromGwei(BigNumber(gasPrice)) })
    }, 500)
  }

  setGasLimit (gasLimit) {
    this.setState({ gasLimit })
    clearTimeout(this.gasLimitSubmitTimeout)
    this.gasLimitSubmitTimeout = setTimeout(() => {
      gasLimit = parseInt(gasLimit)
      if (isNaN(gasLimit)) return
      if (gasLimit > 12.5e6) gasLimit = 12.5e6

      const maxTotalFee = maxFee(this.props.req.data)

      if (usesBaseFee(this.props.req.data)) {
        const baseFee = parseFloat(this.state.baseFee)
        const priorityFee = parseFloat(this.state.priorityFee)

        if (gweiToWei(baseFee + priorityFee) * gasLimit > maxTotalFee) {
          gasLimit = Math.floor(maxTotalFee / gweiToWei(baseFee + priorityFee))
        }
      } else {
        const gasPrice = parseFloat(this.state.gasPrice)
        if (gweiToWei(gasPrice) * gasLimit > maxTotalFee) {
          gasLimit = Math.floor(maxTotalFee / gweiToWei(gasPrice))
        }
      }
      link.rpc('setGasLimit', '0x' + gasLimit.toString(16), this.props.req.handlerId, e => {
        if (e) console.error(e)
      })
      this.setState({ gasLimit: gasLimit.toString() })
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
                baseFee = this.trimGwei(this.limitRange(baseFee + 1, 0, 9999))
                baseFee = this.toDisplayFromGwei(BigNumber(baseFee))
                this.setBaseFee(baseFee)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                let baseFee = parseFloat(this.state.baseFee)
                if (isNaN(baseFee)) return
                baseFee = this.trimGwei(this.limitRange(baseFee - 1, 0, 9999))
                baseFee = this.toDisplayFromGwei(BigNumber(baseFee))
                this.setBaseFee(baseFee)
              }
            }}
          />
        </div>
        <div className='txFeeOverlayLabel'>Max Base Fee (GWEI)</div>
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
                priorityFee = this.trimGwei(this.limitRange(priorityFee + 1, 0, 9999))
                priorityFee = this.toDisplayFromGwei(BigNumber(priorityFee))
                this.setPriorityFee(priorityFee)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                let priorityFee = parseFloat(this.state.priorityFee)
                if (isNaN(priorityFee)) return
                priorityFee = this.trimGwei(this.limitRange(priorityFee - 1, 0, 9999))
                priorityFee = this.toDisplayFromGwei(BigNumber(priorityFee))
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
                let gasPrice = parseFloat(this.state.gasPrice)
                if (isNaN(gasPrice)) return
                gasPrice = this.trimGwei(this.limitRange(gasPrice + 1, 0, 9999))
                gasPrice = this.toDisplayFromGwei(BigNumber(gasPrice))
                this.setGasPrice(gasPrice)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                let gasPrice = parseFloat(this.state.gasPrice)
                if (isNaN(gasPrice)) return
                gasPrice = this.trimGwei(this.limitRange(gasPrice - 1, 0, 9999))
                gasPrice = this.toDisplayFromGwei(BigNumber(gasPrice))
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
    if (usesBaseFee(req.data)) {
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
