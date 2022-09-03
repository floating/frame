import { createObserver, loadAssets } from '../../../../main/provider/assets'
import store from '../../../../main/store'

jest.mock('../../../../main/store')

const account = '0x3ba7bd5cd1c19f678d9c8edfa043de5a57570e06'

beforeEach(() => {
  // ensure that the balances have been updated within the range to not be considered stale
  store.set('main.accounts', account, 'balances.lastUpdated', new Date())
})

describe('#loadAssets', () => {
  it('loads native currency assets', () => {
    const balance = {
      symbol: 'ETH',
      balance: '0xe7',
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1
    }

    store.set('main.balances', account, [balance])

    const priceData = { usd: { price: 3815.91 } }
    store.set('main.networksMeta.ethereum.1.nativeCurrency', priceData)

    expect(loadAssets(account)).toEqual({
      nativeCurrency: [{ ...balance, currencyInfo: priceData }],
      erc20: []
    })
  })

  it('loads token assets', () => {
    const balance = {
      symbol: 'OHM',
      balance: '0x606401fc9',
      address: '0x383518188c0c6d7730d91b2c03a03c837814a899'
    }
  
    store.set('main.balances', account, [balance])

    const priceData = { usd: { price: 225.35 } }
    store.set('main.rates', balance.address, priceData)

    expect(loadAssets(account)).toEqual({
      nativeCurrency: [],
      erc20: [{ ...balance, tokenInfo: { lastKnownPrice: { ...priceData } } }]
    })
  })

  it('throws an error if assets have not been updated in the last 5 minutes', () => {
    const tooOld = new Date()
    tooOld.setMinutes(tooOld.getMinutes() - 6)

    store.set('main.accounts', account, 'balances.lastUpdated', tooOld)

    expect(() => loadAssets(account)).toThrow(/assets not known/)
  })
})

describe('#createObserver', () => {
  const handler = { assetsChanged: jest.fn() }
  const observer = createObserver(handler)

  const fireObserver = () => {
    observer()

    // event debounce time
    jest.advanceTimersByTime(800)
  }

  beforeEach(() => {
    handler.assetsChanged = jest.fn()
    store.set('selected.current', account)
  })

  it('invokes the handler when the account is holding native currency assets', () => {
    const priceData = { usd: { price: 3815.91 } }
    const balance = {
      symbol: 'ETH',
      balance: '0xe7',
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1
    }

    store.set('main.networksMeta.ethereum.1.nativeCurrency', priceData)
    store.set('main.balances', account, [balance])

    fireObserver()

    expect(handler.assetsChanged).toHaveBeenCalledWith(account, {
      nativeCurrency: [{ ...balance, currencyInfo: priceData }],
      erc20: []
    })
  })

  it('invokes the handler when the account is holding token assets', () => {
    const priceData = { usd: { price: 225.35 } }
    const balance = {
      symbol: 'OHM',
      balance: '0x606401fc9',
      address: '0x383518188c0c6d7730d91b2c03a03c837814a899'
    }

    store.set('main.rates', balance.address, priceData)
    store.set('main.balances', account, [balance])

    fireObserver()

    expect(handler.assetsChanged).toHaveBeenCalledWith(account, {
      nativeCurrency: [],
      erc20: [{ ...balance, tokenInfo: { lastKnownPrice: { ...priceData } } }]
    })
  })

  it('does not invoke the handler when no account is selected', () => {
    store.set('main.balances', account, [{ address: '0xany' }])
    store.set('selected.current', undefined)

    fireObserver()

    expect(handler.assetsChanged).not.toHaveBeenCalled()
  })
  
  it('does not invoke the handler when no assets are present', () => {
    store.set('main.balances', account, [])

    fireObserver()

    expect(handler.assetsChanged).not.toHaveBeenCalled()
  })

  it('does not invoke the handler while scanning', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    store.set('main.accounts', account, 'balances.lastUpdated', yesterday)
    store.set('main.balances', account, [{ address: '0xany' }])

    fireObserver()

    expect(handler.assetsChanged).not.toHaveBeenCalled()
  })
})
