import { AssetType } from '@framelabs/pylon-client/dist/assetId'

import store from '../../../../main/store'
import { handleUpdates } from '../../../../main/externalData/rates/store'
import { toTokenId } from '../../../../resources/domain/balance'

jest.mock('../../../../main/store', () => ({
  setNativeCurrencyData: jest.fn(),
  setRates: jest.fn(),
  removeNativeCurrencyRate: jest.fn(),
  removeRate: jest.fn()
}))

const RateUpdate = ({ address, type, chainId = 1, price = 500, usd_24h_change = 1.0 }) => ({
  id: {
    chainId,
    ...(address && { address }),
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

afterEach(() => {
  jest.clearAllTimers()
})

it('handles an empty set of updates', () => {
  handleUpdates([])

  expect(store.setNativeCurrencyData).not.toHaveBeenCalled()
  expect(store.setRates).not.toHaveBeenCalled()
})

it('handles native currency updates', () => {
  const update = RateUpdate({ type: AssetType.NativeCurrency })

  handleUpdates([update])

  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    update.id.chainId,
    Rate(update.data.usd, update.data.usd_24h_change)
  )
})

it('handles token updates', () => {
  const update = RateUpdate({ address: '0x000', type: AssetType.Token })

  handleUpdates([update])

  expect(store.setRates).toHaveBeenCalledWith({
    [toTokenId(update.id)]: Rate(update.data.usd, update.data.usd_24h_change)
  })
})

it('handles a message with both native currency and token updates', () => {
  const nativeCurrencyUpdate = RateUpdate({ type: AssetType.NativeCurrency })
  const tokenUpdate = RateUpdate({ address: '0x000', type: AssetType.Token })

  handleUpdates([nativeCurrencyUpdate, tokenUpdate])

  expect(store.setNativeCurrencyData).toHaveBeenCalledWith(
    'ethereum',
    nativeCurrencyUpdate.id.chainId,
    Rate(nativeCurrencyUpdate.data.usd, nativeCurrencyUpdate.data.usd_24h_change)
  )

  expect(store.setRates).toHaveBeenCalledWith({
    [toTokenId(tokenUpdate.id)]: Rate(tokenUpdate.data.usd, tokenUpdate.data.usd_24h_change)
  })
})

it('expires a native currency rate after 5 minutes', () => {
  const updates = [RateUpdate({ type: AssetType.NativeCurrency })]

  handleUpdates(updates)
  jest.advanceTimersByTime(1000 * 6 * 60)

  expect(store.removeNativeCurrencyRate).toHaveBeenCalledWith('ethereum', updates[0].id.chainId)
})

it('expires a token rate after 5 minutes', () => {
  const updates = [RateUpdate({ address: '0x000000', type: AssetType.Token })]

  handleUpdates(updates)
  jest.advanceTimersByTime(1000 * 6 * 60)

  expect(store.removeRate).toHaveBeenCalledWith(updates[0].id.address)
})

it('resets the expiry time when receiving a new rate', () => {
  const update = RateUpdate({ address: '0x000000', type: AssetType.NativeCurrency })

  handleUpdates([update])
  jest.advanceTimersByTime(1000 * 4 * 60)

  handleUpdates([update])
  jest.advanceTimersByTime(1000 * 3 * 60)

  expect(store.removeNativeCurrencyRate).not.toHaveBeenCalled()
})
