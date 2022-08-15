import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import { isNetworkReady, ChainEditForm } from '../ChainEditForm'

function submitStatus (network, submitted) {
  const status = { ready: false }

  if (submitted) {
    return { ...status, text: 'Updating' }
  }

  if (!isNetworkReady(network)) {
    return { ...status, text: 'Fill in Chain' }
  }

  return { ready: true, text: 'Update Chain' }
}

class UpdateChain extends React.Component {
  constructor (...args) {
    super(...args)
  }

  render () {
    return (
      <ChainEditForm
        chain={this.props.chain}
        existingChain={true}
        title='Update Chain'
        getSubmitStatus={submitStatus}
        onSubmit={(network) => {
          link.send('tray:action', 'updateNetwork', this.props.chain, network)
        }}
      />
    )
  }
}

export default Restore.connect(UpdateChain)
