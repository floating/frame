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
  const formProps = {
    chain,
    labels,
    existingChain: true,
    onSubmit: (updatedChain) => {
      link.send('tray:action', 'updateNetwork', chain, updatedChain)
    }
  }

  return <ChainEditForm {...formProps} />
}

export default Restore.connect(UpdateChain)
