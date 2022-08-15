import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import { ChainEditForm, isNetworkReady } from '../ChainEditForm'


class AddChain extends React.Component {
  constructor (...args) {
    super(...args)

    this.chain = this.req ? this.req.chain : {}
  }

  isValidChain (chainId) {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return !existingChains.includes(parseInt(chainId))
  }

  submitStatus (network, submitted) {
    const status = { ready: false }

    if (submitted) {
      return { ...status, text: 'Creating' }
    }

    if (!isNetworkReady(network)) {
      return { ...status, text: 'Fill in Chain' }
    }

    if (!this.isValidChain(network.id)) {
      return { ...status, text: 'Chain ID already exists' }
    }

    return { ready: true, text: 'Add Chain' }
  }

  render () {
    return (
      <ChainEditForm
        chain={this.chain}
        title='Add New Chain'
        getSubmitStatus={this.submitStatus.bind(this)}
        onSubmit={(network) => {
          link.send('tray:addChain', network)
          link.send('tray:resolveRequest', this.props.req)
        }}
      />
    )
  }
}

export default Restore.connect(AddChain)
