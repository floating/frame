import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../svg'

class ProviderRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {allowInput: false}
    setTimeout(() => {
      this.setState({allowInput: true})
    }, 2000)
  }
  render () {
    let requestClass = 'signerRequest'
    if (this.props.req.status === 'success') requestClass += ' signerRequestSuccess'
    if (this.props.req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (this.props.req.status === 'pending') requestClass += ' signerRequestPending'
    if (this.props.req.status === 'error') requestClass += ' signerRequestError'
    let origin = this.props.req.origin
    let originClass = 'requestProviderOrigin'
    if (origin.length > 28) originClass = 'requestProviderOrigin requestProviderOrigin18'
    if (origin.length > 36) originClass = 'requestProviderOrigin requestProviderOrigin12'
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{top: (this.props.top * 10) + 'px'}}>
        <div className='approveTransaction'>
          {this.props.req.notice ? (
            <div className='requestNotice'>
              {(_ => {
                if (this.props.req.status === 'pending') {
                  return (
                    <div className='requestNoticeInner bounceIn'>
                      <div><div className='loader' /></div>
                    </div>
                  )
                } else if (this.props.req.status === 'success') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('check', {height: '80px'})}</div>
                } else if (this.props.req.status === 'error' || this.props.req.status === 'declined') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('circle-slash', {height: '80px'})}</div>
                }
              })()}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              <div className='approveRequestHeader approveTransactionHeader'>
                <div className='approveRequestHeaderIcon'> {svg.octicon('shield', {height: '20px'})}</div>
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
          <div className='requestDecline' onClick={() => this.store.giveAccess(this.props.req, false)}>
            <div className='requestDeclineButton'>{'Decline'}</div>
          </div>
          <div className='requestSign' onClick={() => this.store.giveAccess(this.props.req, true)}>
            <div className='requestSignButton'>{'Approve'}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(ProviderRequest)
