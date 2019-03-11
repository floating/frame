import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../../svg'

class TxBar extends React.Component {
  render () {
    let req = this.props.req
    let txStatus = req.tx && req.tx.receipt ? req.tx.receipt.status : false
    let position = 0
    let txBarClass = 'txBar'
    if (req.status === 'pending') {
      position = 1
    } else if (req.status === 'signed') {
      position = 2
    } else if (req.status === 'sent') {
      position = 3
    } else if (req.status === 'included' || req.status === 'confirmed') {
      position = 4
      txBarClass += ' txBarSuccess'
    } else if (req.status === 'error') {
      position = 0
      txBarClass += ' txBarError'
    }
    let slideMap = ['370px', '255px', '165px', '75px', '-40px']
    let slide = slideMap[position]
    let notice = this.props.req.notice
    let request = this.props.req
    let confirmations = request.tx && request.tx.confirmations ? request.tx.confirmations : 0
    return (
      <div className={txBarClass}>
        <div className='txProgress'>
          <div className='txProgressBack'>
            <div className='txProgressLine' />
            <div className='txProgressSteps'>
              <div className='txProgressStep'>
                <div className='txProgressStepIcon' style={{ padding: '14px 10px' }}>
                  {svg.sign(22)}
                </div>
                <div className='txProgressStepMarker' />
                <div className={position > 1 ? 'txProgressStepCenter txProgressStepCenterOn' : 'txProgressStepCenter'} />
              </div>
              <div className='txProgressStep'>
                <div className='txProgressStepIcon' style={{ padding: '15px 11px' }}>
                  {svg.send(15)}
                </div>
                <div className='txProgressStepMarker' />
                <div className={position > 2 ? 'txProgressStepCenter txProgressStepCenterOn' : 'txProgressStepCenter'} />
              </div>
              <div className='txProgressStep'>
                <div className='txProgressStepIcon' style={{ padding: '11px 11px' }}>
                  {svg.octicon('check', { height: 24 })}
                </div>
                <div className='txProgressStepMarker' />
                <div className={position > 3 ? 'txProgressStepCenter txProgressStepCenterOn' : 'txProgressStepCenter'} />
              </div>
            </div>
          </div>
          <div className='txProgressFront'>
            <div className='txProgressSlide' style={{ right: slide }}>
              <div className='txProgressTail' />
              <div className='txProgressLoading'>
                <div className='txProgressLoadingDot' />
                <div className='txProgressLoadingCenter' />
                <div className='txProgressLoadingBox' />
              </div>
            </div>
            <div className='txProgressDetails'>
              <div className='txProgressNotice' style={{ transform: `translateY(-${txStatus ? 50 : 0}px)` }}>{notice}</div>
              <div className='txProgressConfirms' style={{ transform: `translateY(-${txStatus ? 0 : 50}px)` }}>
                {[...Array(12).keys()].map(i => {
                  let monitorConfirmsItem = confirmations > i ? 'txProgressConfirmsItem txProgressConfirmsItemGood' : 'txProgressConfirmsItem'
                  return (
                    <div className={monitorConfirmsItem}>{svg.octicon('chevron-right', { height: 14 })}</div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxBar)
