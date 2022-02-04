import BigNumber from 'bignumber.js'
import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'

import {
  addNetwork as addNetworkAction,
  removeBalance as removeBalanceAction,
  setBalances as setBalancesAction,
  addCustomTokens as addCustomTokensAction,
  removeCustomTokens as removeTokensAction,
  addKnownTokens as addKnownTokensAction,
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
      balance: addHexPrefix(new BigNumber(30.5).toString(16))
    }]
  })

  it('adds a new balance', () => {
    setBalances([{
      ...testTokens.zrx,
      balance: addHexPrefix(new BigNumber(7983.2332).toString(16))
    }])
    
    expect(balances).toEqual([
      {
        ...testTokens.badger,
        balance: addHexPrefix(new BigNumber(30.5).toString(16))
      },
      {
        ...testTokens.zrx,
        balance: addHexPrefix(new BigNumber(7983.2332).toString(16))
      }
    ])
  })

  it('updates an existing balance to a positive amount', () => {
    setBalances([{
      ...testTokens.badger,
      balance: addHexPrefix(new BigNumber(41.9).toString(16))
    }])
    
    expect(balances).toEqual([{
      ...testTokens.badger,
      balance: addHexPrefix(new BigNumber(41.9).toString(16))
    }])
  })

  it('updates an existing balance to zero', () => {
    setBalances([{
      ...testTokens.badger,
      balance: '0x0'
    }])
    
    expect(balances).toEqual([{
      ...testTokens.badger,
      balance: '0x0'
    }])
  })
})

describe('#removeBalance', () => {
  let balances = {
    [owner]: [{
        ...testTokens.zrx,
        balance: addHexPrefix(BigNumber('798.564').toString(16))
      },
      {
        ...testTokens.badger,
        balance: addHexPrefix(BigNumber('15.543').toString(16))
      }
    ],
    '0xd0e3872f5fa8ecb49f1911f605c0da90689a484e': [{
      ...testTokens.zrx,
      balance: addHexPrefix(BigNumber('8201.343').toString(16))
    },
    {
      ...testTokens.badger,
      balance: addHexPrefix(BigNumber('101.988').toString(16))
    }]
  }

  const updaterFn = (node, update) => {
    expect(node).toBe('main.balances')

    balances = update(balances)
  }

  const removeBalance = key => removeBalanceAction(updaterFn, 1, key)

  it('removes a balance from all accounts', () => {
    removeBalance(testTokens.zrx.address)

    expect(balances[owner]).not.toContainEqual(expect.objectContaining({ address: testTokens.zrx.address }))
    expect(balances[owner]).toHaveLength(1)
    expect(balances['0xd0e3872f5fa8ecb49f1911f605c0da90689a484e']).not.toContainEqual(expect.objectContaining({ address: testTokens.zrx.address }))
    expect(balances['0xd0e3872f5fa8ecb49f1911f605c0da90689a484e']).toHaveLength(1)
  })
})

describe('#addCustomTokens', () => {
  let tokens = []

  const updaterFn = (node, update) => {
    expect(node).toBe('main.tokens.custom')

    tokens = update(tokens)
  }

  const addTokens = tokensToAdd => addCustomTokensAction(updaterFn, tokensToAdd)

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

describe('#addKnownTokens', () => {
  let tokens = []
  const account = '0xfaff9f426e8071e03eebbfefe9e7bf4b37565ab9'

  const updaterFn = (node, address, update) => {
    expect(node).toBe('main.tokens.known')
    expect(address).toBe(account)

    tokens = update(tokens)
  }

  const addTokens = tokensToAdd => addKnownTokensAction(updaterFn, account, tokensToAdd)

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
