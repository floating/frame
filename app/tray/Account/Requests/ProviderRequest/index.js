import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'

class ProviderRequest extends React.Component {
  constructor(...args) {
    super(...args)

    this.state = { allowInput: false }

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 200)
  }

  render() {
    const status = this.props.req.status
    const notice = this.props.req.notice
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    const originName = this.store('main.origins', this.props.req.origin, 'name')
    let originClass = 'requestProviderOrigin'
    if (origin.length > 28) originClass = 'requestProviderOrigin requestProviderOrigin18'
    if (origin.length > 36) originClass = 'requestProviderOrigin requestProviderOrigin12'
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass}>
        <div className='approveRequest'>
          {notice ? (
            <div className='requestNotice'>
              {status === 'pending' ? (
                <div className='requestNoticeInner'>
                  <div>
                    <div className='loader' />
                  </div>
                </div>
              ) : status === 'success' ? (
                <div className='requestNoticeInner'>{svg.octicon('check', { height: 80 })}</div>
              ) : status === 'error' || status === 'declined' ? (
                <div className='requestNoticeInner'>{svg.octicon('circle-slash', { height: 80 })}</div>
              ) : null}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              <div className='requestProvider'>
                <div className={originClass}>{originName}</div>
                <div className='requestProviderSub'>wants to connect</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(ProviderRequest)
