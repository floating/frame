import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'

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
        getSubmitStatus={() => ({ ready: true, text: 'Update Chain' })}
        onSubmit={(network) => {
          link.send('tray:action', 'updateNetwork', this.props.chain, network)
        }}
      />
    )
  }
}

export default Restore.connect(UpdateChain)
