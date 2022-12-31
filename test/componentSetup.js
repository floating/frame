const userEvent = require('@testing-library/user-event').default
const { render } = require('@testing-library/react')

const advanceTimersByTime = async (ms = 0) => {
  jest.advanceTimersByTime(ms)
  return Promise.resolve()
}

export function setupComponent(jsx, opts = {}) {
  const { advanceTimersAfterInput = false, ...options } = opts
  const advanceTimers =
    options.advanceTimers || (advanceTimersAfterInput ? () => jest.runAllTimers() : advanceTimersByTime)

  return {
    user: userEvent.setup({
      ...options,
      advanceTimers
    }),
    ...render(jsx)
  }
}

export * from '@testing-library/react'

export { setupComponent as render }
