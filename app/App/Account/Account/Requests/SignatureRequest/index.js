import React from 'react'
import Restore from 'react-restore'
import { isHex } from 'web3-utils'
import { stripHexPrefix } from 'ethereumjs-util'
import link from '../../../../../../resources/link'
import QRSignModal from '../../QRSignModal'

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

    const activeAccount = Object.values(this.store('main.accounts')).find(account => account.active).address
    const signRequests = this.store('main.keystone.signRequests')
    const signRequest = signRequests.find(request => request.address === activeAccount)

    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'

    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass}>
        {type === 'sign' ? (
          <div className='approveRequest'>
            <div className='approveTransactionPayload'>
              {this.renderMessage(message)}
            </div>
            <QRSignModal
                showModal={status === 'pending' && signRequest}
                signRequest={signRequest}
                submitSignature={(signature) => {
                  link.rpc('submitKeystoneSignature', signature, () => {})}
                }
                cancelRequestSignature={() => {
                  link.rpc('cancelKeystoneRequestSignature', signRequest.request.requestId, () => {})
                  this.decline(this.props.req.handlerId, this.props.req)
                }}
            />
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + this.props.req.type}</div>
        )}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
