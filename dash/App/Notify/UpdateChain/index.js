import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'

const labels = {
  title: 'Update Chain',
  submit: 'Update Chain',
  submitted: 'Updating'
}

function UpdateChain ({ chain }) {
  return (
    <ChainEditForm
        chain={chain}
        existingChain={true}
        labels={labels}
        onSubmit={(updatedChain) => {
          link.send('tray:action', 'updateNetwork', chain, updatedChain)
        }}
    />
  )
}

export default Restore.connect(UpdateChain)
