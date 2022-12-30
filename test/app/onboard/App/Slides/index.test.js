import React from 'react'

import { user, screen, setupComponent } from '../../../../componentSetup'
import Slides from '../../../../../app/onboard/App/Slides'

it('completes when the user clicks close', async () => {
  const onComplete = jest.fn()
  setupComponent(<Slides slide={6} onComplete={onComplete} />)

  await user.click(screen.getByRole('button', { name: 'Close' }))

  expect(onComplete).toHaveBeenCalled()
})
