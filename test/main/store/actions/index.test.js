import log from 'electron-log'
import { addNetwork as addNetworkAction } from '../../../../main/store/actions'

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

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