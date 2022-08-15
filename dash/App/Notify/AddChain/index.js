import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'

const labels = {
  title: 'Add New Chain',
  submit: 'Add Chain',
  submitted: 'Creating'
}

class AddChain extends React.Component {
  constructor (...args) {
    super(...args)
  }

  chainIdExists (chainId) {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return existingChains.includes(parseInt(chainId))
  }

  render () {
    return (
      <ChainEditForm
        chain={this.props.chain}
        labels={labels}
        invalidateSubmit={(chain) => {
          return this.chainIdExists(chain.id) ? 'Chain ID already exists' : false
        }}
        onSubmit={(network) => {
          link.send('tray:addChain', network)

          if (this.props.req) {
            link.send('tray:resolveRequest', this.props.req)
          }
        }}
      />
    )
  }
}

export default Restore.connect(AddChain)
