import { screen, render } from '../../../componentSetup'
import Confirm from '../../../../resources/Components/Confirm'

it('renders the confirmation prompt', () => {
  render(<Confirm prompt='you sure you wanna do that?' />)

  const titleSection = screen.getByRole('heading')
  expect(titleSection.textContent).toBe('you sure you wanna do that?')
})

it('renders the decline button with provided text', () => {
  render(<Confirm declineText='no way' />)

  const declineButton = screen.getByRole('button', { name: 'no way' })
  expect(declineButton).toBeDefined()
})

it('handles a declined confirmation', async () => {
  const onDecline = jest.fn()
  const { user } = render(<Confirm onDecline={onDecline} />)

  await user.click(screen.getByRole('button', { name: 'Decline' }))

  expect(onDecline).toHaveBeenCalled()
})

it('renders the accept button with provided text', () => {
  render(<Confirm acceptText='lets gooooo' />)

  const acceptButton = screen.getByRole('button', { name: 'lets gooooo' })
  expect(acceptButton).toBeDefined()
})

it('handles an accepted confirmation', async () => {
  const onAccept = jest.fn()
  const { user } = render(<Confirm onAccept={onAccept} />)

  await user.click(screen.getByRole('button', { name: 'OK' }))

  expect(onAccept).toHaveBeenCalled()
})
