import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'
import { DangerousSubmitButton } from '../Button'

const labels = {
  title: 'Update Chain',
  submit: 'Update Chain',
  submitted: 'Updating'
}

function UpdateChain ({ chain }) {
  const RemoveChainButton = () => {
    return (
      <DangerousSubmitButton
        text='Remove Chain'
        handleClick={() => {
          const confirmAction = { view: 'notify', data: { notify: 'confirmRemoveChain', notifyData: { chain } } }
          link.send('tray:action', 'navDash', confirmAction)
        }}
      />
    )
  }
  const color = this.store('main.networksMeta.ethereum', chain.id, 'primaryColor')

  return (
    <>
      <ChainEditForm
        chain={{ ...chain, color }}
        labels={labels}
        existingChain={true}
        onSubmit={(updatedChain) => {
          link.send('tray:action', 'updateNetwork', chain, updatedChain)
        }}
      />

      <div className='chainRow'>
        <RemoveChainButton />
      </div>
    </>
  )
}

export default Restore.connect(UpdateChain)
