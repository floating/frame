import externalData from '../../../main/externalData'
import store from '../../../main/store'

jest.mock('@framelabs/pylon-client', () => jest.fn())
jest.mock('../../../main/store')
jest.mock('../../../main/externalData/inventory', () => jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })))
jest.mock('../../../main/externalData/assets', () => jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })))
jest.mock('../../../main/externalData/balances', () => jest.fn(() => mockBalances))

let dataManager, mockBalances

beforeEach(() => {
  store.set('tray.open', true)

  mockBalances = { start: jest.fn(), stop: jest.fn(), pause: jest.fn(), resume: jest.fn() }
  dataManager = externalData()
})

afterEach(() => {
  dataManager.close()
})

describe('hiding and showing the tray', () => {
  it('pauses the balances scanner if the tray is hidden for 1 minute', () => {
    setTrayShown(false)

    expect(mockBalances.pause).toHaveBeenCalled()
  })

  it('does not pause the balances scanner if the tray was already hidden', () => {
    setTrayShown(false)
    setTrayShown(false)

    expect(mockBalances.pause).toHaveBeenCalledTimes(1)
  })

  it('does not attempt to resume the balances scanner the first time the tray is shown', () => {
    setTrayShown(true)

    expect(mockBalances.resume).not.toHaveBeenCalled()
  })

  it('resumes the balances scanner when the tray is shown after previously being hidden', () => {
    setTrayShown(false)
    setTrayShown(true)

    expect(mockBalances.resume).toHaveBeenCalled()
  })
})

function setTrayShown (shown) {
  store.set('tray.open', shown)
  store.getObserver('externalData:tray').fire()

  jest.advanceTimersByTime(1000 * 60)
}
