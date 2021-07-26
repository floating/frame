import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'
// import svg from '../../../../../../../../resources/svg'

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

class TxFee extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.chain = { 
      type: 'ethereum', 
      id: parseInt(props.req.data.chainId, 'hex').toString()
    }
  }
  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }
  toDisplayEther (bn) {
    return parseFloat(bn.shiftedBy(-18).toFixed(6).toString())
  }
  toDisplayGwei (bn) {
    return parseFloat(bn.shiftedBy(-9).toFixed(4).toString())
  }
  render () {
    const req = this.props.req

    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0

    let maxFeePerGas, maxFee, maxFeeUSD

    if (req.data.type === '0x2') {  
      const baseFee = BigNumber(req.data.maxFeePerGas, 16)
      const priorityFee = BigNumber(req.data.maxPriorityFeePerGas, 16)
      const gasLimit = BigNumber(req.data.gasLimit, 16)
  
      maxFeePerGas = baseFee.plus(priorityFee)

      maxFee = maxFeePerGas.multipliedBy(gasLimit)
      maxFeeUSD = maxFee.multipliedBy(nativeUSD)
    } else {
      const gasLimit = BigNumber(req.data.gasLimit, 16)
  
      maxFeePerGas = BigNumber(req.data.gasPrice, 16)
      maxFee = maxFeePerGas.multipliedBy(gasLimit)
      maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
    }
    
    return (
      <div className='_txFee'>
        <div className='_txFeeInner'>
          <div className='_txFeeSlice _txFeeLabel'>fee</div>
          <div className='_txFeeSlice _txFeeGwei' onClick={() => {
            this.props.overlayMode('fee')
            setTimeout(() => {
              this.props.overlayMode()
            }, 2000)
          }}>
            <span className='_txFeeGweiValue'>{this.toDisplayGwei(maxFeePerGas)}</span>
            <span className='_txFeeGweiLabel'>Gwei</span>
          </div>
          <div className='_txFeeSlice _txFeeValue'>
            <span className='_txFeeETH'>
              ETH
            </span>
            <span className='_txFeeETHValue'>
              {this.toDisplayEther(maxFee)}
            </span>
            <span className='_txFeeEq'>
              ≈
            </span>
            <span className='_txFeeUSD'>
              ${this.toDisplayUSD(maxFeeUSD)}
            </span>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxFee)
