import React from 'react'
import Restore from 'react-restore'
import { fromWei, isHex } from 'web3-utils'
import { stripHexPrefix } from 'ethereumjs-util'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'

function decodeMessage (rawMessage) {
  if (isHex(rawMessage)) {
    const buff = Buffer.from(stripHexPrefix(rawMessage), 'hex')
    return buff.length === 32 ? rawMessage : buff.toString('utf8')
  }

  // replace all multiple line returns with just one to prevent excess space in message
  return rawMessage.replaceAll(/[\n\r]+/g, '\n')
}

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }

    const props = args[0] || {}

    this.signRefs = [React.createRef(), React.createRef()]

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

  toggleDataView (id) {
    this.setState({ dataView: !this.state.dataView })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  renderMessage (message) {
    let showMore = false
    if (this.signRefs[0].current && this.signRefs[1].current) {
      const inner = this.signRefs[1].current.clientHeight
      const wrap = this.signRefs[0].current.clientHeight + this.signRefs[0].current.scrollTop
      if (inner > wrap) showMore = true
    }
    return (
      <div ref={this.signRefs[0]} className='signValue'>
        <div ref={this.signRefs[1]} className='signValueInner'>{message}</div>
        {showMore ? <div className='signValueMore'>scroll to see more</div> : null}
      </div>
    )
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
    // const height = mode === 'monitor' ? '215px' : '340px'
    // const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass}>
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
                  {this.renderMessage(message)}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + this.props.req.type}</div>
        )}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
