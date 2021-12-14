import BigNumber from 'bignumber.js'
import log from 'electron-log'

import {
  addNetwork as addNetworkAction,
  removeBalance as removeBalanceAction,
  setBalances as setBalancesAction,
  addCustomTokens as addTokensAction,
  removeCustomTokens as removeTokensAction,
  setScanning as setScanningAction
} from '../../../../main/store/actions'

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

const owner = '0xa8be0f701d0f37088600164e71bffc0ad652c251'

const testTokens = {
  zrx: {
    chainId: 1,
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    symbol: 'ZRX',
    decimals: 18
  },
  badger: {
    chainId: 42161,
    address: '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e',
    symbol: 'BADGER',
    decimals: 18
  }
}

describe('#addNetwork', () => {
  const polygonNetwork = {
    id: 137,
    name: 'Polygon',
    type: 'ethereum',
    layer: 'sidechain',
    explorer: 'https://polygonscan.com',
    symbol: 'MATIC'
  }

  let networks, networksMeta

  const updaterFn = (node, update) => {
    if (node !== 'main') throw new Error(`attempted to update wrong node: ${node}`)
    update({ networks, networksMeta })
  }

  const addNetwork = network => addNetworkAction(updaterFn, network)

  beforeEach(() => {
    networks = { ethereum: {} }
    networksMeta = { ethereum: {} }
  })

  it('adds a network with the correct id', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].id).toBe(137)
  })

  it('adds a network with the correct id if the id is a number represented as a string', () => {
    addNetwork({ ...polygonNetwork, id: '137' })

    expect(networks.ethereum['137'].id).toBe(137)
  })

  it('adds a network with the correct name', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].name).toBe('Polygon')
  })

  it('adds a network with the correct symbol', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].symbol).toBe('MATIC')
  })

  it('adds a network with the correct layer', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].layer).toBe('sidechain')
  })

  it('adds a network with the correct explorer', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].explorer).toBe('https://polygonscan.com')
  })

  it('adds a network that is on by default', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].on).toBe(true)
  })

  it('adds a network with the correct primary RPC', () => {
    polygonNetwork.primaryRpc = 'https://polygon-rpc.com'

    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].primaryRpc).toBeUndefined()
    expect(networks.ethereum['137'].connection.primary.custom).toBe('https://polygon-rpc.com')
  })

  it('adds a network with the correct secondary RPC', () => {
    polygonNetwork.secondaryRpc = 'https://rpc-mainnet.matic.network'

    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].secondaryRpc).toBeUndefined()
    expect(networks.ethereum['137'].connection.secondary.custom).toBe( 'https://rpc-mainnet.matic.network')
  })

  it('adds a network with the correct default connection presets', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].connection.presets).toEqual({ local: 'direct' })
  })

  it('adds a network with the correct default primary connection settings', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].connection.primary).toEqual({ 
      on: true, 
      current: 'custom', 
      status: 'loading', 
      connected: false, 
      type: '', 
      network: '', 
      custom: ''
    })
  })

  it('adds a network with the correct default secondary connection settings', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].connection.secondary).toEqual({ 
      on: false, 
      current: 'custom', 
      status: 'loading', 
      connected: false, 
      type: '', 
      network: '', 
      custom: ''
    })
  })

  it('adds a network with the correct default gas settings', () => {
    addNetwork(polygonNetwork)

    expect(networks.ethereum['137'].gas).toEqual({
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    })
  })

  it('adds a network with the correct default metadata', () => {
    addNetwork(polygonNetwork)

    expect(networksMeta.ethereum['137']).toEqual({
      gas: {
        price: {
          selected: 'standard',
          levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        }
      }
    })
  })

  it('does not add the network if id is not a parseable number', () => {
    addNetwork({ ...polygonNetwork, id: 'test' })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if name is not defined', () => {
    addNetwork({ ...polygonNetwork, name: undefined })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if explorer is not defined', () => {
    addNetwork({ ...polygonNetwork, explorer: undefined })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if symbol is not defined', () => {
    addNetwork({ ...polygonNetwork, symbol: undefined })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if type is not a string', () => {
    addNetwork({ ...polygonNetwork, type: 2 })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if type is not "ethereum"', () => {
    addNetwork({ ...polygonNetwork, type: 'solana' })

    expect(Object.keys(networks.ethereum)).toHaveLength(0)
    expect(Object.keys(networksMeta.ethereum)).toHaveLength(0)
  })

  it('does not add the network if the networks already exists', () => {
    networks.ethereum['137'] = { ...polygonNetwork }
  
    addNetwork({
      id: 137,
      type: 'ethereum',
      name: 'Matic v1',
      explorer: 'https://rpc-mainnet.maticvigil.com',
      symbol: 'MATIC'
    })

    expect(networks.ethereum['137'].name).toBe('Polygon')
    expect(networks.ethereum['137'].explorer).toBe('https://polygonscan.com')
  })
})

describe('#setBalances', () => {
  const updaterFn = (node, address, update) => {
    expect(node).toBe('main.balances')
    expect(address).toBe(owner)

    balances = update(balances)
  }

  const setBalances = updatedBalances => setBalancesAction(updaterFn, owner, updatedBalances)

  let balances

  beforeEach(() => {
    balances = [{
      ...testTokens.badger,
      balance: new BigNumber(30.5)
    }]
  })

  it('adds a new balance', () => {
    setBalances([{
      ...testTokens.zrx,
      balance: new BigNumber(7983.2332)
    }])
    
    expect(balances).toEqual([
      {
        ...testTokens.badger,
        balance: new BigNumber(30.5)
      },
      {
        ...testTokens.zrx,
        balance: new BigNumber(7983.2332)
      }
    ])
  })

  it('updates an existing balance to a positive amount', () => {
    setBalances([{
      ...testTokens.badger,
      balance: new BigNumber(41.9)
    }])
    
    expect(balances).toEqual([{
      ...testTokens.badger,
      balance: new BigNumber(41.9)
    }])
  })

  it('updates an existing balance to zero', () => {
    setBalances([{
      ...testTokens.badger,
      balance: new BigNumber(0)
    }])
    
    expect(balances).toEqual([{
      ...testTokens.badger,
      balance: new BigNumber(0)
    }])
  })
})

describe('#addCustomTokens', () => {
  let tokens = []

  const updaterFn = (node, update) => {
    expect(node).toBe('main.tokens.custom')

    tokens = update(tokens)
  }

  const addTokens = tokensToAdd => addTokensAction(updaterFn, tokensToAdd)

  it('adds a token', () => {
    tokens = [testTokens.zrx]

    addTokens([testTokens.badger])

    expect(tokens).toStrictEqual([testTokens.zrx, testTokens.badger])
  })

  it('overwrites a token', () => {
    tokens = [testTokens.zrx, testTokens.badger]

    const updatedBadgerToken = {
      ...testTokens.badger,
      symbol: 'BAD'
    }

    addTokens([updatedBadgerToken])

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toEqual(testTokens.zrx)
    expect(tokens[1].symbol).toBe('BAD')
  })
})

describe('#removeCustomTokens', () => {
  let tokens = []

  const updaterFn = (node, update) => {
    expect(node).toBe('main.tokens.custom')

    tokens = update(tokens)
  }

  const removeTokens = tokensToRemove => removeTokensAction(updaterFn, tokensToRemove)

  it('removes a token', () => {
    tokens = [testTokens.zrx, testTokens.badger]
    
    const tokenToRemove = { ...testTokens.zrx }

    removeTokens([tokenToRemove])

    expect(tokens).toStrictEqual([testTokens.badger])
  })

  it('does not modify tokens if they cannot be found', () => {
    tokens = [testTokens.zrx, testTokens.badger]

    const tokenToRemove = {
      chainId: 1,
      address: '0x383518188c0c6d7730d91b2c03a03c837814a899',
      symbol: 'OHM'
    }

    removeTokens([tokenToRemove])

    expect(tokens).toStrictEqual([testTokens.zrx, testTokens.badger])
  })

  it('does not remove a token with the same address but different chain id', () => {
    const tokenToRemove = {
      ...testTokens.badger,
      chainId: 1
    }

    tokens = [testTokens.zrx, testTokens.badger, tokenToRemove]

    removeTokens([tokenToRemove])

    expect(tokens).toStrictEqual([testTokens.zrx, testTokens.badger])
  })

  it('does not remove a token with the same chain id but different address', () => {
    const tokenToRemove = {
      ...testTokens.zrx,
      address: '0xa7a82dd06901f29ab14af63faf3358ad101724a8'
    }

    tokens = [testTokens.zrx, testTokens.badger, tokenToRemove]

    removeTokens([tokenToRemove])

    expect(tokens).toStrictEqual([testTokens.zrx, testTokens.badger])
  })
})

describe('#setScanning', () => {
  let isScanning

  beforeAll(() => {
    isScanning = false
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  const updaterFn = (node, address, update) => {
    expect(node).toBe('main.scanning')
    expect(address).toBe(owner)

    isScanning = update()
  }

  const setScanning = scanning => setScanningAction(updaterFn, owner, scanning)

  it('immediately sets the state to scanning', () => {
    setScanning(true)

    expect(isScanning).toBe(true)
  })

  it('sets the state back to not scanning after 1 second', () => {
    setScanning(false)

    expect(isScanning).toBe(true)

    jest.advanceTimersByTime(1000)

    expect(isScanning).toBe(false)
  })
})
