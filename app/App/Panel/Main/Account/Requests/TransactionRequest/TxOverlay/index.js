import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'
import svg from '../../../../../../../../resources/svg'
import link from '../../../../../../../../resources/link'

import TxDataOverlay from './TxDataOverlay'


class TxModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.state = {
      active: false
    }
  }

  // mouseDetect (e) {
  //   if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
  //     this.setActive(false)
  //   }
  // }

  // setActive (active) {
  //   if (!this.props.req || !this.props.req.data || !this.props.req.data.data) return
  //   this.setState({ active })
  //   clearTimeout(this.expandActiveTimeout)
  //   if (active) {
  //     document.addEventListener('mousedown', this.mouseDetect.bind(this))
  //     this.setState({ expandActive: true })
  //   } else {
  //     document.removeEventListener('mousedown', this.mouseDetect)
  //     this.expandActiveTimeout = setTimeout(() => {
  //       this.setState({ expandActive: false })
  //     }, 320)
  //   }
  // }

  toDisplayEther (bn) {
    return parseFloat(bn.shiftedBy(-18).toFixed(6).toString())
  }
  toDisplayGwei (bn) {
    return parseFloat(bn.shiftedBy(-9).toFixed(4).toString())
  }

  render () {
    const req = this.props.req
    console.log('req', req) 
    if (this.props.overlayMode === 'fee') {
      if (req.data.type === '0x2') {
        const baseFee = BigNumber(req.data.maxFeePerGas, 16)
        const priorityFee = BigNumber(req.data.maxPriorityFeePerGas, 16)
        const gasLimit = BigNumber(req.data.gasLimit, 16)
        return (
          <div className='txOverlay cardShow'>
            <div className='txOverlayTitle'>Adjust Fee</div>
            <div className='txOverlayBody'>
              {'EIP-1559 Tx Details'}
              <div className='txOverlayBaseFee'>
                <span>Base Fee: {this.toDisplayGwei(baseFee)}</span>
                <span>GWEI</span>
              </div>
              <div className='txOverlayPriorityFee'>
                <span>Priority Fee: {this.toDisplayGwei(priorityFee)}</span>
                <span>GWEI</span>
              </div>
              <div className='txOverlayGasLimit'>
                <span>Gas Limit: {gasLimit.toString()}</span>
                <span>UNITS</span>
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
            <div className='txOverlayBody'>
              {'Legacy Tx Details'}
              <div className='txOverlayGasFee'>GasFee Fee: {this.toDisplayGwei(gasPrice)}</div>
              <div className='txOverlayGasLimit'>Gas Limit: {gasLimit.toString()}</div>
            </div>
          </div>
        )
      }
    } else if (this.props.overlayMode === 'data') {
      return (
        <div className='txOverlay cardShow'>
          <TxDataOverlay req={req} />
        </div>
      )
    } else {
      return null
    }
  }
}

export default Restore.connect(TxModule)