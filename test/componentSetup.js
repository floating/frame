const userEvent = require('@testing-library/user-event').default
const { render } = require('@testing-library/react')

export function advanceTimers (ms = 0) {
  jest.advanceTimersByTime(ms)
  return Promise.resolve()
}

export function setupComponent (jsx, options = {}) {
  return {
    user: userEvent.setup({
      ...options,
      advanceTimers: options.advanceTimers || advanceTimers
    }),
    ...render(jsx)
  }
}
