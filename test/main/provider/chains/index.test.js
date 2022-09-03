import { createChainsObserver, createOriginChainObserver, getActiveChains } from '../../../../main/provider/chains'
import store from '../../../../main/store'

jest.mock('../../../../main/store', () => jest.fn())

const chains = {
  '1': { name: 'Mainnet', id: 1, on: true },
  '4': { name: 'Rinkeby', id: 4, on: true },
  '137': { name: 'Polygon', id: 137, on: false }
}

beforeEach(() => {
  setChains(chains)
})

describe('#getActiveChains', () => {
  it('returns all chains that are active', () => {
    expect(getActiveChains()).toEqual([1, 4])
  })
})

describe('#createChainsObserver', () => {
  const handler = { chainsChanged: jest.fn() }
  let observer

  beforeEach(() => {
    observer = createChainsObserver(handler)

    handler.chainsChanged = jest.fn()
  })

  it('invokes the handler when a chain is added', () => {
    setChains({ ...chains, '10': { name: 'Optimism', id: 10, on: true }})

    observer()

    expect(handler.chainsChanged).toHaveBeenCalledWith([1, 4, 10])
  })
  
  it('invokes the handler when a chain is removed', () => {
    const { '4': rinkeby, ...remaining } = chains
    setChains(remaining)

    observer()

    expect(handler.chainsChanged).toHaveBeenCalledWith([1])
  })
  
  it('invokes the handler when a chain is activated', () => {
    const { '137': { ...polygon } } = chains
    polygon.on = true

    setChains({ ...chains, '137': polygon })

    observer()

    expect(handler.chainsChanged).toHaveBeenCalledWith([1, 4, 137])
  })
  
  it('invokes the handler when a chain is deactivated', () => {
    const { '4': { ...rinkeby } } = chains
    rinkeby.on = false

    setChains({ ...chains, '4': rinkeby })

    observer()

    expect(handler.chainsChanged).toHaveBeenCalledWith([1])
  })

  it('does not invoke the handler when no chains have changed', () => {
    observer()

    expect(handler.chainsChanged).not.toHaveBeenCalled()
  })
})

describe('#createOriginChainObserver', () => {
  const handler = { chainChanged: jest.fn(), networkChanged: jest.fn() }
  let observer

  const originId = '8073729a-5e59-53b7-9e69-5d9bcff94087'
  const frameTestOrigin = {
    name: 'test.frame',
    chain: { id: 137, type: 'ethereum' }
  }

  beforeEach(() => {
    setOrigins({ [originId]: frameTestOrigin })

    observer = createOriginChainObserver(handler)

    handler.chainChanged = jest.fn()
    handler.networkChanged = jest.fn()

    // invoke the observer once in order to set the known origins
    observer()
  })

  it('invokes the handler when the chain has changed for a known origin', () => {
    const updatedOrigin = { ...frameTestOrigin, chain: { ...frameTestOrigin.chain, id: 42161 } }
    setOrigins({ [originId]: updatedOrigin })

    observer()

    expect(handler.chainChanged).toHaveBeenCalledWith(42161, originId)
    expect(handler.networkChanged).toHaveBeenCalledWith(42161, originId)
  })

  it('does not invoke the handler the first time an origin is seen', () => {
    const newOrigin = { name: 'send.eth', chain: { type: 'ethereum', id: 4 } }
    setOrigins({ 'some-id': newOrigin })

    observer()

    expect(handler.chainChanged).not.toHaveBeenCalled()
    expect(handler.networkChanged).not.toHaveBeenCalled()
  })
})

// helper functions

function setChains (chainState) {
  store.mockImplementation(node => {
    expect(node).toBe('main.networks.ethereum')
    return chainState
  })
}

function setOrigins (originState) {
  store.mockImplementation(node => {
    expect(node).toBe('main.origins')
    return originState
  })
}
