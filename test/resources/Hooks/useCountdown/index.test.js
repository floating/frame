/** @jest-environment jsdom */
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { render, screen } from '../../../componentSetup'
import useCountdown from '../../../../resources/Hooks/useCountdown'
import CountdownComponent from '../../../../resources/Components/Countdown'

const startDate = new Date('2023-01-01')
const nextDay = new Date('2023-01-02')

const consoleErrorFn = jest.spyOn(console, 'error').mockImplementation(() => jest.fn())

const renderHookWithCount = (hook, ...args) => {
  let count = 0
  const renderCount = () => count
  const result = renderHook(() => {
    count++
    return hook(args)
  })
  return { renderCount, ...result }
}

const TestComponent = ({ end }) => (
  <CountdownComponent
    {...{
      end,
      title: test
    }}
  />
)

describe('#useCountdown', () => {
  beforeEach(() => {
    jest.setSystemTime(startDate)
  })

  afterAll(() => {
    consoleErrorFn.mockRestore()
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

  it('updates the countdown time every second', () => {
    const secondsPassed = 12
    const { renderCount } = renderHookWithCount(useCountdown, '2023-01-02')
    for (let i = 0; i < secondsPassed; i++) {
      act(() => {
        jest.advanceTimersByTime(secondsPassed * 1000)
      })
    }
    expect(renderCount()).toBe(secondsPassed + 1)
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

  it('throws an error when an invalid date is passed in', () => {
    expect(() => {
      renderHook(() => useCountdown('INVALID_DATE_CONSTRUCTOR VALUE'))
    }).toThrow(Error('Invalid targetDate passed into useCountdown'))
  })
})
