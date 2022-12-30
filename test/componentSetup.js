const userEvent = require('@testing-library/user-event').default
const { render, act: rtlAct, screen: rtlScreen } = require('@testing-library/react')

export function advanceTimers(ms = 0) {
  rtlAct(() => {
    jest.advanceTimersByTime(ms)
  })

  return Promise.resolve()
}

export function setupComponent(jsx) {
  return render(jsx)
}

export function setupUser(timerFunc = advanceTimers) {
  return userEvent.setup({ advanceTimers: timerFunc })
}

export const user = userEvent.setup({ advanceTimers })
export const screen = rtlScreen
export const act = rtlAct
