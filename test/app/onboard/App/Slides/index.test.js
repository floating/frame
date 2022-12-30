import React from 'react'

import { render, screen } from '../../../../componentSetup'
import Slides from '../../../../../app/onboard/App/Slides'

it('completes when the user clicks close', async () => {
  const onComplete = jest.fn()
  const { user } = render(<Slides slide={6} onComplete={onComplete} />)

  await user.click(screen.getByRole('button', { name: 'Close' }))

  expect(onComplete).toHaveBeenCalled()
})
