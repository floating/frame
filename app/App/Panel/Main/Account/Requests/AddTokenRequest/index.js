import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

class AddTokenRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 200)
  }

  render () {
    const status = this.props.req.status
    const notice = this.props.req.notice
    const type = this.props.req.type
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'

    const origin = this.props.req.origin
    let originClass = 'requestTokenOrigin'
    if (origin.length > 28) originClass = 'requestTokenOrigin requestTokenOrigin18'
    if (origin.length > 36) originClass = 'requestTokenOrigin requestTokenOrigin12'

    const mode = this.props.req.mode
    const height = mode === 'monitor' ? '80px' : '340px'
    const token = this.props.req.token
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height }}>
        <div className='approveRequest'>
          {notice ? (
            <div className='requestNotice'>
              {(_ => {
                if (status === 'pending') {
                  return (
                    <div className='requestNoticeInner scaleIn'>
                      <div><div className='loader' /></div>
                    </div>
                  )
                } else if (status === 'success') {
                  return <div className='requestNoticeInner scaleIn'>{svg.octicon('check', { height: 80 })}</div>
                } else if (status === 'error' || status === 'declined') {
                  return <div className='requestNoticeInner scaleIn'>{svg.octicon('circle-slash', { height: 80 })}</div>
                }
              })()}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              {
                <div className='approveRequestHeader approveTransactionHeader'>
                  <div className='approveRequestHeaderIcon'> {svg.octicon('shield', { height: 20 })}</div>
                  <div className='approveRequestHeaderLabel'> Add Token</div>
                </div>
              }
              <div className='requestToken scaleIn'>
                <div className='requestTokenInner'>
                  <div className={originClass}>{this.props.req.origin}</div>
                  <div className={'requestTokenOriginSub'}>{'wants to add a token'}</div>
                  <div className='requestTokenInfo'>
                    <div className='requestTokenSymbol'>{token.symbol.toUpperCase()}</div>
                    <div className='requestTokenName'>{token.name}</div>
                    <div className='requestTokenAddress'>{token.address}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {
          <div className='requestApprove'>
            <div
              className='requestDecline'
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput && this.props.onTop) link.send('tray:addToken', false, this.props.req)
            }}>
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div
              className='requestSign'
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput && this.props.onTop) this.store.notify('addToken', this.props.req)
            }}>
              <div className='requestSignButton _txButton'>Review</div>
            </div>
          </div>
        }
      </div>
    )
  }
}

export default Restore.connect(AddTokenRequest)
