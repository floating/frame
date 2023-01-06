/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import useCopiedMessage from '../../../../resources/Hooks/useCopiedMessage'
import link from '../../../../resources/link'

jest.mock('../../../../resources/link', () => ({
  send: jest.fn()
}))

describe('#useCopied', () => {
  jest.useFakeTimers()

  let result

  const getBool = () => result.current[0]
  const copyFn = () => result.current[1]()

  beforeEach(() => {
    ;({ result } = renderHook(() => useCopiedMessage('VALUE')))
    jest.clearAllMocks()
  })

  it('should correctly initialise a boolean to check if the copiedMessage should be shown', () => {
    expect(result.current[0]).toBe(false)
  })

  it('should expose a function to copy to clipboard', () => {
    expect(typeof result.current[1]).toBe('function')
  })

  it('should set the boolean value as true when the copy function is called', () => {
    act(() => {
      copyFn()
    })
    expect(getBool()).toBe(true)
  })

  it('should reset the boolean value after 1 second', () => {
    act(() => {
      copyFn()
      jest.advanceTimersByTime(1000)
    })
    expect(getBool()).toBe(false)
  })

  it('should call the clipboardData function inside link when the copy function is called', () => {
    act(() => {
      copyFn()
    })
    expect(link.send).toHaveBeenCalledWith('tray:clipboardData', 'VALUE')
    expect(link.send).toHaveBeenCalledTimes(1)
  })
})
