import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

class ProviderRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 2000)
  }
  render () {
    let status = this.props.req.status
    let notice = this.props.req.notice
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    let origin = this.props.req.origin
    let originClass = 'requestProviderOrigin'
    if (origin.length > 28) originClass = 'requestProviderOrigin requestProviderOrigin18'
    if (origin.length > 36) originClass = 'requestProviderOrigin requestProviderOrigin12'
    let mode = this.props.req.mode
    let height = mode === 'monitor' ? '80px' : '370px'
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height }}>
        <div className='approveTransaction'>
          {notice ? (
            <div className='requestNotice'>
              {(_ => {
                if (status === 'pending') {
                  return (
                    <div className='requestNoticeInner bounceIn'>
                      <div><div className='loader' /></div>
                    </div>
                  )
                } else if (status === 'success') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('check', { height: 80 })}</div>
                } else if (status === 'error' || status === 'declined') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('circle-slash', { height: 80 })}</div>
                }
              })()}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              <div className='approveRequestHeader approveTransactionHeader'>
                <div className='approveRequestHeaderIcon'> {svg.octicon('shield', { height: 20 })}</div>
                <div className='approveRequestHeaderLabel'> {'Connection'}</div>
              </div>
              <div className='requestProvider bounceIn'>
                <div className={originClass}>{origin}</div>
                <div className='requestProviderSub'>{'wants to connect'}</div>
              </div>
            </div>
          )}
        </div>
        <div className='requestApprove'>
          <div className='requestDecline' onMouseDown={() => { if (this.state.allowInput) link.send('tray:giveAccess', this.props.req, false) }}>
            <div className='requestDeclineButton'>{'Decline'}</div>
          </div>
          <div className='requestSign' onMouseDown={() => { if (this.state.allowInput) link.send('tray:giveAccess', this.props.req, true) }}>
            <div className='requestSignButton'>{'Approve'}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(ProviderRequest)
