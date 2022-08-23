import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'

class ChainRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 200)
  }

  render () {
    const { status, notice, type, chain } = this.props.req
    
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
              <div className='requestChainInner'>
                <div className={originClass}>{this.store('main.origins', this.props.req.origin, 'name')}</div>
                <div className={'requestChainOriginSub'}>{type === 'switchChain' ? 'wants to switch to chain' : 'wants to add chain'}</div>
                <div className='requestChainName'>{type === 'switchChain' ? (
                  this.store('main.networks', chain.type, parseInt(chain.id), 'name')
                ) : chain.name}</div>
              </div>
            </div>
          )}
        </div>
        {type === 'switchChain' ? (
          <div className='requestApprove'>
            <div 
              className='requestDecline' 
              style={{ pointerEvents: this.state.allowInput? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', false, false, this.props.req) 
            }}>
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div 
              className='requestSign' 
              style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', chain.type, parseInt(chain.id), this.props.req)
            }}>
              <div className='requestSignButton _txButton'>Switch</div>
            </div>
          </div>
        ) : (
          <div className='requestApprove'>
            <div 
              className='requestDecline' 
              style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
              onClick={() => { 
                if (this.state.allowInput) {
                  link.send('tray:rejectRequest', this.props.req)
                }
              }
            }>
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div 
              className='requestSign' 
              style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
              onClick={() => {
                if (this.state.allowInput) {
                  link.send('tray:resolveRequest', this.props.req, null)
                  link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'addChain', notifyData: { chain } } })
                }
              }
            }>
              <div className='requestSignButton _txButton'>Review</div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default Restore.connect(ChainRequest)
