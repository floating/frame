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
        <DangerousSubmitButton
          handleClick={async () => {
            const { accepted } = await link.invoke('dash:confirm', { prompt: 'Are you sure you want to remove this chain?' })

            if (accepted) {
              link.send('tray:action', 'removeNetwork', chain)

              // if accepted, go back twice to get back to the main chains panel
              link.send('tray:action', 'backDash')
            }

            // if declined, go back once to get to the chain update panel
            link.send('tray:action', 'backDash')
          }}
          text='Remove Chain'
        />
      </div>
    </>
  )
}

export default Restore.connect(UpdateChain)
