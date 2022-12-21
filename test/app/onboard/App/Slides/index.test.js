import React from 'react'

import { setupComponent } from '../../../../componentSetup'
import Slides from '../../../../../app/onboard/App/Slides'

it('completes when the user clicks close', async () => {
  const onComplete = jest.fn()
  const { user, getByRole } = setupComponent(<Slides slide={6} onComplete={onComplete} />)

  await user.click(getByRole('button', { name: 'Close' }))

  expect(onComplete).toHaveBeenCalled()
})
