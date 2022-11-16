import React from 'react'

import { setupComponent } from '../../../componentSetup'
import Confirm from '../../../../resources/Components/Confirm'

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

it('renders the confirmation prompt', () => {
  const { getByRole } = setupComponent(<Confirm prompt='you sure you wanna do that?' />)

  const titleSection = getByRole('heading')
  expect(titleSection.textContent).toBe('you sure you wanna do that?')
})

it('renders the decline button with provided text', () => {
  const { getByRole } = setupComponent(<Confirm declineText='no way' />)

  const declineButton = getByRole('button', { name: 'no way' })
  expect(declineButton).toBeDefined()
})

it('handles a declined confirmation', async () => {
  const onDecline = jest.fn()
  const { user, getByRole } = setupComponent(<Confirm onDecline={onDecline} />)

  await user.click(getByRole('button', { name: 'Decline' }))

  expect(onDecline).toHaveBeenCalled()
})

it('renders the accept button with provided text', () => {
  const { getByRole } = setupComponent(<Confirm acceptText='lets gooooo' />)

  const acceptButton = getByRole('button', { name: 'lets gooooo' })
  expect(acceptButton).toBeDefined()
})

it('handles an accepted confirmation', async () => {
  const onAccept = jest.fn()
  const { user, getByRole } = setupComponent(<Confirm onAccept={onAccept} />)

  await user.click(getByRole('button', { name: 'OK' }))

  expect(onAccept).toHaveBeenCalled()
})
