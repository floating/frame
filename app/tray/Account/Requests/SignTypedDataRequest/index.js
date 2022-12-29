import React from 'react'
import Restore from 'react-restore'

import TokenPermit from './TokenPermit'
import DefaultSignature from './Default'

const permitTypes = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }
]

const isEip2612Permit = ({
  typedMessage: {
    data: {
      types: { Permit }
    }
  }
}) =>
  Permit?.length === permitTypes.length &&
  permitTypes.every(({ name, type }) =>
    Boolean(Permit.find((item) => item.name === name && item.type === type))
  )

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

  getDecodedView(req) {
    const originName = this.store('main.origins', req.origin, 'name')

    if (isEip2612Permit(req)) {
      const chainId = req.typedMessage.data.domain.chainId
      const chainName = this.store('main.networks.ethereum', chainId, 'name')
      const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chainId)
      return <TokenPermit {...{ originName, chainName, chainColor: primaryColor, icon, ...this.props }} />
    }

    return <DefaultSignature {...{ originName, req }} />
  }

  render() {
    const { req } = this.props
    const requestClass = getRequestClass(req)
    return (
      <div key={req.id || req.handlerId} className={requestClass}>
        {this.getDecodedView(req)}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
