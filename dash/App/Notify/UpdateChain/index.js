import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'
import { BadSubmitButton } from '../Button'

const labels = {
  title: 'Update Chain',
  submit: 'Update Chain',
  submitted: 'Updating'
}

function UpdateChain ({ chain }) {
  return (
    <>
      <ChainEditForm
        chain={chain}
        labels={labels}
        existingChain={true}
        onSubmit={(updatedChain) => {
          link.send('tray:action', 'updateNetwork', chain, updatedChain)
        }}
      />

      <div className='chainRow'>
        <BadSubmitButton
          handleClick={() => {
            const data = {
              prompt: 'Are you sure you want to remove this chain?'
            }
  
            link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'confirm', notifyData: { ...data }} })
          }}
          text='Remove Chain'
        />
      </div>
    </>
  )
}

export default Restore.connect(UpdateChain)
