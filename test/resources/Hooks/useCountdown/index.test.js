/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import useCountdown from '../../../../resources/Hooks/useCountdown'

const renderHookWithCount = (hook, ...args) => {
  let count = 0
  const renderCount = () => count
  const result = renderHook(() => {
    count++
    return hook(args)
  })
  return { renderCount, ...result }
}

describe('#useCountdown', () => {
  const startDate = new Date('2023-01-01')
  const nextDay = new Date('2023-01-02')
  let result

  const setupCountdown = (date = nextDay.getTime()) => {
    ;({ result } = renderHook(() => useCountdown(date)))
  }

  const getValue = () => result.current
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(startDate)
    setupCountdown()
  })

  it('correctly sets the initial countdown time', () => {
    expect(getValue()).toBe('24h')
  })

  it('updates the countdown time after a second', () => {
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(getValue()).toBe('23h 59m 59s')
  })

  it('updates the countdown time every second', () => {
    let renderCount
    const secondsPassed = 12
    ;({ result, renderCount } = renderHookWithCount(useCountdown, '2023-01-02'))
    for (let i = 0; i < secondsPassed; i++) {
      act(() => {
        jest.advanceTimersByTime(secondsPassed * 1000 + 500)
      })
    }
    expect(renderCount()).toBe(secondsPassed + 1)
  })

  it('uses the correct extension for seconds', () => {
    setupCountdown(startDate.getTime() + 1000)
    expect(getValue()).toBe('1s')
  })
  it('uses the correct extension for minutes', () => {
    setupCountdown(startDate.getTime() + 1000 * 60)
    expect(getValue()).toBe('1m')
  })
  it('uses the correct extension for hours', () => {
    setupCountdown(startDate.getTime() + 1000 * 60 * 60)
    expect(getValue()).toBe('1h')
  })
  it('sets the value correctly when the countdown has been completed', () => {
    act(() => {
      jest.advanceTimersByTime(1000 * 60 * 60 * 24)
    })
    expect(getValue()).toBe('EXPIRED')
  })
  it('sets the value to the completed state when a past date in passed in', () => {
    setupCountdown(startDate.getTime() - 1000)
    expect(getValue()).toBe('EXPIRED')
  })
  it('throws an error when an invalid date is passed in', () => {
    expect(() => {
      renderHook(() => useCountdown('INVALID_DATE_CONSTRUCTOR VALUE'))
    }).toThrow()
  })
})
