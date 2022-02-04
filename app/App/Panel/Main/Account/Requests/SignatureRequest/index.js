import React from 'react'
import Restore from 'react-restore'
import { fromWei, isHex } from 'web3-utils'
import { stripHexPrefix } from 'ethereumjs-util'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

function decodeMessage (rawMessage) {
  if (isHex(rawMessage)) {
    const buff = Buffer.from(stripHexPrefix(rawMessage), 'hex')
    return buff.length === 32 ? rawMessage : buff.toString('utf8')
  }

  return rawMessage
}

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }

    const props = args[0] || {}

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }

  decline (reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }

  toggleDataView (id) {
    this.setState({ dataView: !this.state.dataView })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  render () {
    const type = this.props.req.type
    const status = this.props.req.status
    const notice = this.props.req.notice
    const payload = this.props.req.payload

    const message = decodeMessage(payload.params[1])

    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    const mode = this.props.req.mode
    const height = mode === 'monitor' ? '215px' : '340px'
    const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: z }}>
        {type === 'sign' ? (
          <div className='approveRequest'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestCover'>
                  {(_ => {
                    if (status === 'pending') {
                      return (
                        <div key={status} className='requestNoticeInner cardShow'>
                          <div style={{ paddingBottom: 20 }}><div className='loader' /></div>
                          <div className='requestNoticeInnerText'>See Signer</div>
                          <div className='cancelRequest' onMouseDown={() => this.decline(this.props.req.handlerId, this.props.req)}>Cancel</div>
                        </div>
                      )
                    } else if (status === 'success') {
                      return (
                        <div key={status} className='requestNoticeInner cardShow requestNoticeSuccess'>
                          <div>{svg.octicon('check', { height: 80 })}</div>
                          <div className='requestNoticeInnerText'>{notice}</div>
                        </div>
                      )
                    } else if (status === 'error' || status === 'declined') {
                      return (
                        <div key={status} className='requestNoticeInner cardShow requestNoticeError'>
                          <div>{svg.octicon('circle-slash', { height: 80 })}</div>
                          <div className='requestNoticeInnerText'>{notice}</div>
                        </div>
                      )
                    } else {
                      return <div key={notice} className='requestNoticeInner cardShow'>{notice}</div>
                    }
                  })()}
                </div>
              ) : (
                <>
                  <div className='approveRequestHeader approveTransactionHeader'>
                    <div className='approveRequestHeaderIcon'> {svg.octicon('pencil', { height: 20 })}</div>
                    <div className='approveRequestHeaderLabel'> Sign Message</div>
                  </div>
                  <div className='signValue'>
                    <div className='signValueInner'>{message}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + this.props.req.type}</div>
        )}
        <div className='requestApprove'>
          <div 
            className='requestDecline' 
            style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
            onClick={() => { if (this.state.allowInput && this.props.onTop) this.decline(this.props.req.handlerId, this.props.req) 
          }}>
            <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
          </div>
          <div 
            className='requestSign' 
            style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
            onClick={() => { if (this.state.allowInput && this.props.onTop) this.approve(this.props.req.handlerId, this.props.req) 
          }}>
            <div className='requestSignButton _txButton'>Sign</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
