import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

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
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    const mode = this.props.req.mode
    const height = mode === 'monitor' ? '80px' : '340px'
    const chain = this.props.req.chain
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
              <div className='approveRequestHeader approveTransactionHeader'>
                <div className='approveRequestHeaderIcon'> {svg.octicon('shield', { height: 20 })}</div>
                <div className='approveRequestHeaderLabel'> Add Chain</div>
              </div>
              <div className='requestProvider scaleIn'>
                <div>{this.props.req.origin}</div>

                <div>
                  <div>{chain.id + ' ' + chain.name}</div>
                  <div>{'id and name'}</div>
                </div>
                <div>
                  <div>{chain.explorer}</div>
                  <div>{'explorer'}</div>
                </div>
                <div>
                  <div>{chain.symbol}</div>
                  <div>{'symbol'}</div>
                </div>
                <div>
                  <div>{chain.rpcUrl}</div>
                  <div>{'rpcUrl'}</div>
                </div>
                {/* <pre>{JSON.stringify(Object.keys(this.props.req.payload.params[0]), null, 2)}</pre> */}
                {/* <pre>
                  {JSON.stringify(this.props.req, null, 1)}
                </pre> */}
              </div>
            </div>
          )}
        </div>
        <div className='requestApprove'>
          <div 
            className='requestDecline' 
            style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
            onClick={() => { if (this.state.allowInput && this.props.onTop) link.send('tray:addChain', this.props.req, false) 
          }}>
            <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
          </div>
          <div 
            className='requestSign' 
            style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
            onClick={() => { if (this.state.allowInput && this.props.onTop) link.send('tray:addChain', this.props.req, true) 
          }}>
            <div className='requestSignButton _txButton'>Approve</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(ChainRequest)
