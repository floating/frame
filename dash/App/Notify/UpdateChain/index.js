import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'

const labels = {
  title: 'Update Chain',
  submit: 'Update Chain',
  submitted: 'Updating'
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
        labels={labels}
        onSubmit={(network) => {
          link.send('tray:action', 'updateNetwork', this.props.chain, network)
        }}
      />
    )
  }
}

export default Restore.connect(UpdateChain)
