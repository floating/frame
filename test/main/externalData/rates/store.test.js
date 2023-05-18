import { handleUpdates } from '../../../../main/externalData/rates/store'
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

beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

it('handles an empty set of updates', () => {
  // this will throw if there are any issues
  handleUpdates([])
})

it('handles only native currency updates', () => {
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)

  handleUpdates([update])

  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    update.id.chainId,
    Rate(update.data.usd, update.data.usd_24h_change)
  )
})

it('handles only token updates', () => {
  const update = RateUpdate('0x000', AssetType.Token)
  handleUpdates([update])
  expect(store.setRates).toHaveBeenCalledWith({
    [update.id.address]: Rate(update.data.usd, update.data.usd_24h_change)
  })
})

it('handles both native currency and token updates', () => {
  const u1 = RateUpdate('0x000000', AssetType.NativeCurrency)
  const u2 = RateUpdate('0x000', AssetType.Token)
  const updates = [u1, u2]
  handleUpdates(updates)
  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    u1.id.chainId,
    Rate(u1.data.usd, u1.data.usd_24h_change)
  )
  expect(store.setRates).toHaveBeenCalledWith({
    [u2.id.address]: Rate(u2.data.usd, u2.data.usd_24h_change)
  })
})

it('sets timeout for native currency updates', () => {
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)
  handleUpdates([update])

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), RATES_EXPIRY_TIMEOUT)

  setTimeoutSpy.mockRestore() // Clean up spy
})

it('sets timeout for token updates', () => {
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
  const update = RateUpdate('0x000', AssetType.Token)
  handleUpdates([update])

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), RATES_EXPIRY_TIMEOUT)

  setTimeoutSpy.mockRestore()
})

it('expires a native currency rate after a given period of time', () => {
  const updates = [RateUpdate('0x000000', AssetType.NativeCurrency)]
  handleUpdates(updates)
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT + 1)

  expect(store.removeNativeCurrencyData).toHaveBeenCalledWith('ethereum', updates[0].id.chainId)
  expect(store.removeRate).not.toHaveBeenCalled()
})

it('expires a token rate after a given period of time', () => {
  const updates = [RateUpdate('0x000000', AssetType.Token)]
  handleUpdates(updates)
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT + 1)

  expect(store.removeRate).toHaveBeenCalledWith(updates[0].id.address)
  expect(store.removeNativeCurrencyData).not.toHaveBeenCalled()
})

it('resets the expiry time when receiving a new rate', () => {
  const update = RateUpdate('0x000000', AssetType.NativeCurrency)
  handleUpdates([update])
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT * 0.9)
  handleUpdates([update])
  jest.advanceTimersByTime(RATES_EXPIRY_TIMEOUT * 0.5)

  expect(store.removeNativeCurrencyData).not.toHaveBeenCalled()
})

it('ignores malformed native currency updates (missing an address)', () => {
  const update = RateUpdate('0x0000', AssetType.NativeCurrency)
  delete update.id.address

  handleUpdates([update])
  expect(store.setNativeCurrencyData).not.toHaveBeenCalled()
})

it('ignores token updates with no address', () => {
  const update = RateUpdate('0x0000', AssetType.Token)
  delete update.id.address

  handleUpdates([update])
  expect(store.setRates).not.toHaveBeenCalled()
})
