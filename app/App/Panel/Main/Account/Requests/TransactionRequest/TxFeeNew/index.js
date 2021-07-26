import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../../../../../../resources/svg'

class TxFee extends React.Component {
  render () {
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
            <span className='_txFeeGweiValue'>0.0015</span>
            <span className='_txFeeGweiLabel'>Gwei</span>
          </div>
          <div className='_txFeeSlice _txFeeValue'>
            <span className='_txFeeETH'>
              ETH
            </span>
            <span className='_txFeeETHValue'>
              0.000017 
            </span>
            <span className='_txFeeEq'>
              ≈
            </span>
            <span className='_txFeeUSD'>
              $110.30 
            </span>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxFee)
