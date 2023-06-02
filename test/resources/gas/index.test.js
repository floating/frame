import store from '../../../main/store'
import { getMaxTotalFee } from '../../../resources/gas'

jest.mock('../../../main/store/persist')

describe('#getMaxTotalFee', () => {
  beforeEach(() => {
    store.setNativeCurrencyData('ethereum', '1', { usd: { price: 0.5 } })
    store.setMaxTotalFee('ethereum', '1', '10000e18', Date.now() + 5000)
  })

  it('should return the stored max fee', () => {
    const maxTotalFee = getMaxTotalFee(store, 1)
    expect(maxTotalFee.toNumber()).toBe(10000e18)
  })

  describe('when the stored max fee has expired', () => {
    const expiredDateTime = Date.now() - 60 * 1000

    beforeEach(() => {
      store.setMaxTotalFee('ethereum', '1', '10000e18', expiredDateTime)
      store.setNativeCurrencyData('ethereum', '1', { usd: { price: 2 } })
    })

    it('should recalculate and return a new max fee', () => {
      const maxTotalFee = getMaxTotalFee(store, 1)
      expect(maxTotalFee.toNumber()).toBe(2500e18)
    })

    it('should recalculate and store a new max fee', () => {
      getMaxTotalFee(store, 1)
      const networksMeta = store('main.networksMeta.ethereum.1')
      expect(networksMeta.maxTotalFee).toBe('2.5e+21')
      expect(networksMeta.maxTotalFeeExpiry).toBe(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    describe('and the native currency USD price is not known', () => {
      beforeEach(() => {
        store.setNativeCurrencyData('ethereum', '1', { usd: { price: 0 } })
      })

      it('should return the stored max fee', () => {
        const maxTotalFee = getMaxTotalFee(store, 1)
        expect(maxTotalFee.toNumber()).toBe(10000e18)
      })

      it('should not recalculate and store a new max fee', () => {
        getMaxTotalFee(store, 1)
        const networksMeta = store('main.networksMeta.ethereum.1')
        expect(networksMeta.maxTotalFee).toBe('10000e18')
        expect(networksMeta.maxTotalFeeExpiry).toBe(expiredDateTime)
      })
    })

    describe('and the chain is a testnet', () => {
      beforeEach(() => {
        store.updateNetwork(
          { id: 1, type: 'ethereum', explorer: '', symbol: 'ETH', name: '' },
          { id: 1, type: 'ethereum', explorer: '', symbol: 'ETH', name: '', isTestnet: true }
        )
      })

      it('should return undefined', () => {
        const maxTotalFee = getMaxTotalFee(store, 1)
        expect(maxTotalFee).toBe(undefined)
      })

      it('should not recalculate and store a new max fee', () => {
        getMaxTotalFee(store, 1)
        const networksMeta = store('main.networksMeta.ethereum.1')
        expect(networksMeta.maxTotalFee).toBe('10000e18')
        expect(networksMeta.maxTotalFeeExpiry).toBe(expiredDateTime)
      })
    })
  })
})
