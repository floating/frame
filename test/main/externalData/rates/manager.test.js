import getRatesManager from '../../../../main/externalData/rates/manager'
import { AssetType } from '@framelabs/pylon-client/dist/assetId'
import store from '../../../../main/store'
import { RATES_EXPIRY_TIMEOUT } from '../../../../resources/constants'

jest.mock('../../../../main/store')
jest.useFakeTimers()

store.setNativeCurrencyData = jest.fn()
store.setRates = jest.fn()
store.removeNativeCurrencyData = jest.fn()
store.removeRate = jest.fn()

const RateUpdate = (address, type, chainId = 1, price = 500, usd_24h_change = 1.0) => ({
  id: {
    chainId,
    address,
    type
  },
  data: {
    usd: {
      price,
      usd_24h_change
    }
  }
})

const Rate = (price, change24hr) => ({
  usd: {
    price,
    change24hr
  }
})

let ratesManager

beforeEach(() => {
  jest.resetAllMocks()
  jest.clearAllTimers()
  ratesManager = getRatesManager(store)
})

test('handles no updates', () => {
  ratesManager.handleUpdates([])
  // Will throw if there are any issues...
})

test('handles only native currency updates', () => {
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)

  ratesManager.handleUpdates([update])

  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    update.id.chainId,
    Rate(update.data.usd, update.data.usd_24h_change)
  )
})

test('handles only token updates', () => {
  const update = RateUpdate('0x000', AssetType.Token)
  ratesManager.handleUpdates([update])
  expect(store.setRates).toHaveBeenCalledWith({
    [update.id.address]: Rate(update.data.usd, update.data.usd_24h_change)
  })
})

test('handles both native currency and token updates', () => {
  const u1 = RateUpdate('0x000000', AssetType.NativeCurrency)
  const u2 = RateUpdate('0x000', AssetType.Token)
  const updates = [u1, u2]
  ratesManager.handleUpdates(updates)
  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    u1.id.chainId,
    Rate(u1.data.usd, u1.data.usd_24h_change)
  )
  expect(store.setRates).toHaveBeenCalledWith({
    [u2.id.address]: Rate(u2.data.usd, u2.data.usd_24h_change)
  })
})

test('sets timeout for native currency updates', () => {
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)
  ratesManager.handleUpdates([update])

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), RATES_EXPIRY_TIMEOUT)

  setTimeoutSpy.mockRestore() // Clean up spy
})

test('sets timeout for token updates', () => {
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
  const update = RateUpdate('0x000', AssetType.Token)
  ratesManager.handleUpdates([update])

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), RATES_EXPIRY_TIMEOUT)

  setTimeoutSpy.mockRestore()
})

test('timeout removes native currency rate', () => {
  const updates = [RateUpdate('0x000000', AssetType.NativeCurrency)]
  ratesManager.handleUpdates(updates)
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT + 1)

  expect(store.removeNativeCurrencyData).toHaveBeenCalledWith('ethereum', updates[0].id.chainId)
  expect(store.removeRate).not.toHaveBeenCalled()
})

test('timeout removes token rate', () => {
  const updates = [RateUpdate('0x000000', AssetType.Token)]
  ratesManager.handleUpdates(updates)
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT + 1)

  expect(store.removeRate).toHaveBeenCalledWith(updates[0].id.address)
  expect(store.removeNativeCurrencyData).not.toHaveBeenCalled()
})

test('subsequent updates reset timeout', () => {
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)
  ratesManager.handleUpdates([update])
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT * 0.9)
  ratesManager.handleUpdates([update])
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT * 0.5)

  expect(store.removeNativeCurrencyData).not.toHaveBeenCalled()
})

test('ignores malformed native currency updates (missing an address)', () => {
  const update = RateUpdate('0x0000', AssetType.NativeCurrency)
  delete update.id.address

  ratesManager.handleUpdates([update])
  expect(store.setNativeCurrencyData).not.toHaveBeenCalled()
})

test('ignores malformed token updates (missing an address)', () => {
  const update = RateUpdate('0x0000', AssetType.Token)
  delete update.id.address

  ratesManager.handleUpdates([update])
  expect(store.setRates).not.toHaveBeenCalled()
})
