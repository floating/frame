/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import useCountdown from '../../../../resources/Hooks/useCountdown'

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

const setupCountdown = (date) => renderHook(() => useCountdown(date))

describe('#useCountdown', () => {
  beforeEach(() => {
    jest.setSystemTime(startDate)
  })

  afterAll(() => {
    consoleErrorFn.mockRestore()
  })

  it('correctly sets the initial countdown time', () => {
    const {
      result: { current }
    } = setupCountdown(nextDay.getTime())
    expect(current).toBe('24h')
  })

  it('updates the countdown time after a second', () => {
    const { result } = setupCountdown(nextDay.getTime())
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('23h 59m 59s')
  })

  it('updates the countdown time every second', () => {
    const secondsPassed = 12
    const { renderCount } = renderHookWithCount(useCountdown, '2023-01-02')
    for (let i = 0; i < secondsPassed; i++) {
      act(() => {
        jest.advanceTimersByTime(secondsPassed * 1000 + 500)
      })
    }
    expect(renderCount()).toBe(secondsPassed + 1)
  })

  it('uses the correct extension for seconds', () => {
    const { result } = setupCountdown(startDate.getTime() + 1000)
    expect(result.current).toBe('1s')
  })
  it('uses the correct extension for minutes', () => {
    const { result } = setupCountdown(startDate.getTime() + 1000 * 60)
    expect(result.current).toBe('1m')
  })
  it('uses the correct extension for hours', () => {
    const { result } = setupCountdown(startDate.getTime() + 1000 * 60 * 60)
    expect(result.current).toBe('1h')
  })
  it('sets the value correctly when the countdown has been completed', () => {
    const { result } = setupCountdown(nextDay.getTime())
    act(() => {
      jest.advanceTimersByTime(1000 * 60 * 60 * 24)
    })
    expect(result.current).toBe('EXPIRED')
  })
  it('sets the value to the completed state when a past date in passed in', () => {
    const { result } = setupCountdown(startDate.getTime() - 1000)
    expect(result.current).toBe('EXPIRED')
  })

  it('throws an error when an invalid date is passed in', () => {
    expect(() => {
      renderHook(() => useCountdown('INVALID_DATE_CONSTRUCTOR VALUE'))
    }).toThrow(Error('Invalid targetDate passed into useCountdown'))
  })
})
