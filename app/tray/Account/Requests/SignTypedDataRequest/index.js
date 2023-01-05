import React from 'react'
import Restore from 'react-restore'
import TypedSignatureOverview from '../../../../../../resources/Components/SimpleTypedData'

const getRequestClass = ({ status = '' }) =>
  `signerRequest ${status.charAt(0).toUpperCase() + status.slice(1)}`

class TransactionRequest extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }

    const props = args[0] || {}

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  render() {
    const { req } = this.props
    const originName = this.store('main.origins', req.origin, 'name')
    const requestClass = getRequestClass(req)
    return (
      <div key={req.id || req.handlerId} className={requestClass}>
        <TypedSignatureOverview {...{ originName, req }} />
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
