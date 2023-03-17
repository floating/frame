import { render, screen, act } from '../../../componentSetup'
import useCountdown from '../../../../resources/Hooks/useCountdown'

const startDate = new Date('2023-01-01')
const nextDay = new Date('2023-01-02')

const TestComponent = ({ end }) => {
  const ttl = useCountdown(end)

  return <div role='timer'>{ttl}</div>
}

beforeEach(() => {
  jest.setSystemTime(startDate)
})

it('correctly sets the initial countdown time', () => {
  render(<TestComponent end={nextDay.getTime()} />)
  expect(screen.getByRole('timer').textContent).toBe('24h')
})

it('updates the countdown time after a second', () => {
  render(<TestComponent end={nextDay.getTime()} />)

  act(() => {
    jest.advanceTimersByTime(1_000)
  })

  expect(screen.getByRole('timer').textContent).toBe('23h 59m 59s')
})

it('uses the correct extension for seconds', () => {
  render(<TestComponent end={startDate.getTime() + 1_000} />)
  expect(screen.getByRole('timer').textContent).toBe('1s')
})

it('uses the correct extension for minutes', () => {
  render(<TestComponent end={startDate.getTime() + 1_000 * 60} />)
  expect(screen.getByRole('timer').textContent).toBe('1m')
})

it('uses the correct extension for hours', () => {
  render(<TestComponent end={startDate.getTime() + 1_000 * 60 * 60} />)
  expect(screen.getByRole('timer').textContent).toBe('1h')
})

it('sets the value correctly when the countdown has been completed', () => {
  render(<TestComponent end={nextDay.getTime()} />)

  act(() => {
    jest.advanceTimersByTime(1_000 * 60 * 60 * 24)
  })

  expect(screen.getByRole('timer').textContent).toBe('EXPIRED')
})

it('sets the value to the completed state when a past date in passed in', () => {
  render(<TestComponent end={startDate.getDate() - 1} />)
  expect(screen.getByRole('timer').textContent).toBe('EXPIRED')
})
