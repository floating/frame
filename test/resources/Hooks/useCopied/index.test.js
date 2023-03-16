import { render, screen } from '../../../componentSetup'
import useCopiedMessage from '../../../../resources/Hooks/useCopiedMessage'
import link from '../../../../resources/link'

const TestComponent = () => {
  const [showCopiedMessage, copyText] = useCopiedMessage('use frame!')

  return (
    <>
      <button onClick={copyText}>Copy</button>
      <div data-testid='iscopied'>{showCopiedMessage ? 'message copied!' : 'waiting for click'}</div>
    </>
  )
}

jest.mock('../../../../resources/link', () => ({
  send: jest.fn()
}))

it('should not display the copied text by default', () => {
  render(<TestComponent />)

  expect(screen.getByTestId('iscopied').textContent).toBe('waiting for click')
})

it('should let the component know to display the copied text after the copy function is invoked', async () => {
  const { user } = render(<TestComponent />)

  const clickToCopyButton = screen.getByRole('button')
  await user.click(clickToCopyButton)

  expect(screen.getByTestId('iscopied').textContent).toBe('message copied!')
})

it('should reset the copied text after one second', async () => {
  const { user } = render(<TestComponent />, { advanceTimersAfterInput: true })

  const clickToCopyButton = screen.getByRole('button')
  await user.click(clickToCopyButton)

  expect(screen.getByTestId('iscopied').textContent).toBe('waiting for click')
})

it('send the copied data to the clipboard', async () => {
  const { user } = render(<TestComponent />)

  const clickToCopyButton = screen.getByRole('button')
  await user.click(clickToCopyButton)

  expect(link.send).toHaveBeenCalledTimes(1)
  expect(link.send).toHaveBeenCalledWith('tray:clipboardData', 'use frame!')
})
