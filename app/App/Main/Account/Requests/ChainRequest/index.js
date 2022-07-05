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
    const status = this.props.req.status
    const notice = this.props.req.notice
    const type = this.props.req.type
    const chain = this.props.req.chain
    
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
              {type === 'switchChain' ? ( 
                <div className='approveRequestHeader approveTransactionHeader'>
                  <div className='approveRequestHeaderIcon'> {svg.octicon('shield', { height: 20 })}</div>
                  <div className='approveRequestHeaderLabel'> Switch Chain</div>
                </div>
              ) : (
                <div className='approveRequestHeader approveTransactionHeader'>
                  <div className='approveRequestHeaderIcon'> {svg.octicon('shield', { height: 20 })}</div>
                  <div className='approveRequestHeaderLabel'> Add Chain</div>
                </div>
              )}
              <div className='requestChain scaleIn'>
                <div className='requestChainInner'>
                  <div className={originClass}>{this.store('main.origins', this.props.req.origin, 'name')}</div>
                  <div className={'requestChainOriginSub'}>{type === 'switchChain' ? 'wants to switch to chain' : 'wants to add chain'}</div>
                  <div className='requestChainName'>{type === 'switchChain' ? (
                    this.store('main.networks', chain.type, parseInt(chain.id), 'name')
                  ) : chain.name}</div>
                </div>
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
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput && this.props.onTop) link.send('tray:addChain', false, this.props.req) 
            }}>
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div 
              className='requestSign' 
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => { if (this.state.allowInput && this.props.onTop) this.store.notify('addChain', this.props.req) 
            }}>
              <div className='requestSignButton _txButton'>Review</div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default Restore.connect(ChainRequest)
