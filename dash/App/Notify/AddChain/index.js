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
  chainIdExists (chainId) {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return existingChains.includes(parseInt(chainId))
  }

  render () {
    const { chain, req } = this.props

    return (
      <ChainEditForm
        chain={chain}
        labels={labels}
        invalidateSubmit={(enteredChain) => {
          return this.chainIdExists(enteredChain.id) ? 'Chain ID already exists' : false
        }}
        onSubmit={(addedChain) => {
          link.send('tray:addChain', addedChain)

          if (req) {
            link.send('tray:resolveRequest', req)
          }
        }}
      />
    )
  }
}

export default Restore.connect(AddChain)
