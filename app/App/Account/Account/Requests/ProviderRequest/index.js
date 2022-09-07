import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'

class ProviderRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 200)
  }

  render () {
    const { status, notice, origin: originId } = this.props.req
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    const origin = this.store('main.origins', originId)
    const originName = origin ? origin.name : 'Unknown Origin'
    let originClass = 'requestProviderOrigin'
    if (originId.length > 28) originClass = 'requestProviderOrigin requestProviderOrigin18'
    if (originId.length > 36) originClass = 'requestProviderOrigin requestProviderOrigin12'
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
                <div className='requestNoticeInner'>
                  {svg.octicon('check', { height: 80 })}
                </div>
              ) : status === 'error' || status === 'declined' ? (
                <div className='requestNoticeInner'>
                  {svg.octicon('circle-slash', { height: 80 })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              <div className='requestProvider'>
                <div className={originClass}>
                  {originName}
                </div>
                <div className='requestProviderSub'>
                  wants to connect
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(ProviderRequest)
