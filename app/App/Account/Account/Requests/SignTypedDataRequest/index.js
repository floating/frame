import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

const SimpleJSON = ({ json }) => {
  return (
    <div className='simpleJson'>
      {Object.keys(json).map((key, o) => (
        <div key={key + o} className='simpleJsonChild'>
          <div className='simpleJsonKey'>{key}:</div>
          <div className='simpleJsonValue'>
            {typeof json[key] === 'object' ? (
              <SimpleJSON json={json[key]} key={key} />
            ) : (
              json[key]
            )}
          </div>
        </div>
      ))}
    </div>
  )
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

  render () {
    const { req } = this.props
    const type = req.type
    const status = req.status
    const notice = req.notice
    const payload = req.payload
    const typedData = payload.params[1] || {}
    const originName = this.store('main.origins', req.origin, 'name')

    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'

    const messageToSign = typedData.domain
     ? (
        <div className='signTypedData'>
          <div className='signTypedDataInner'>
            <div className='signTypedDataSection'>
              <div className='signTypedDataTitle'>Domain</div>
              <SimpleJSON json={typedData.domain} />
            </div>
            <div className='signTypedDataSection'>
              <div className='signTypedDataTitle'>Message</div>
              <SimpleJSON json={typedData.message} />
            </div>
          </div>
        </div>
        )
      : (
        <div className='signTypedData'>
          <div className='signTypedDataInner'>
            <div className='signTypedDataSection'>
            <SimpleJSON json={
              typedData.reduce((data, elem) => {
                data[elem.name] = elem.value
                return data
              }, {})
            } />
          </div>
        </div>
      </div>
      )
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass}>
        {type === 'signTypedData' ? (
          <div className='approveRequest'>
            <div className='approveTransactionPayload'>
              <>
                <div className='requestMeta'>
                  <div className='requestMetaOrigin'>{originName}</div>
                </div>
                {messageToSign}
              </>
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
