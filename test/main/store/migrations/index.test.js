import log from 'electron-log'

import migrations from '../../../../main/store/migrations'
import { getDefaultAccountName } from '../../../../resources/domain/account'
import { capitalize } from '../../../../resources/utils'

let state

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

const createChainState = (chainId) => {
  state.main.networks.ethereum[chainId] = { id: chainId }
  state.main.networksMeta.ethereum[chainId] = { nativeCurrency: {} }
}

beforeEach(() => {
  state = {
    main: {
      _version: 0,
      networks: { ethereum: {} },
      networksMeta: { ethereum: {} },
      accounts: {},
      balances: {},
      tokens: { known: {} }
    }
  }
})

describe('migration 13', () => {
  beforeEach(() => {
    state.main._version = 12

    state.main.networks.ethereum = {
      1: {
        id: 1,
        type: 'ethereum',
        layer: 'mainnet',
        symbol: 'ETH',
        name: 'Mainnet'
      },
      137: {
        id: 1,
        type: 'ethereum',
        layer: 'sidechain',
        symbol: 'MATIC',
        name: 'Polygon',
        connection: {
          primary: {
            on: true,
            current: 'matic'
          },
          secondary: {
            on: false,
            current: 'local'
          }
        }
      }
    }
  })

  it('adds network meta for a network with none defined', () => {
    const updatedState = migrations.apply(state, 13)

    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.selected')
    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.levels')
  })

  it('adds default gas price info', () => {
    state.main.networksMeta.ethereum = {
      1: {}
    }

    const updatedState = migrations.apply(state, 13)

    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.selected')
    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.levels')
  })

  it('adds sets a default selected gas level', () => {
    state.main.networksMeta.ethereum = {
      1: {
        gas: {
          price: {
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        }
      }
    }

    const updatedState = migrations.apply(state, 13)

    expect(updatedState.main.networksMeta.ethereum[1].gas.price.selected).toBe('standard')
  })

  it('adds default gas levels', () => {
    state.main.networksMeta.ethereum = {
      1: {
        gas: {
          price: {
            selected: 'standard'
          }
        }
      }
    }

    const updatedState = migrations.apply(state, 13)

    ;['slow', 'standard', 'fast', 'asap', 'custom'].forEach((level) => {
      expect(updatedState.main.networksMeta.ethereum[1].gas.price).toHaveProperty(`levels.${level}`)
    })
  })

  it('does not change existing gas settings', () => {
    state.main.networksMeta.ethereum = {
      1: {
        gas: {
          price: {
            selected: 'asap',
            levels: {
              slow: '0x0a93'
            }
          }
        }
      }
    }

    const updatedState = migrations.apply(state, 13)

    expect(updatedState.main.networksMeta.ethereum[1].gas.price.selected).toBe('asap')
    expect(updatedState.main.networksMeta.ethereum[1].gas.price.levels.slow).toBe('0x0a93')
  })
})

describe('migration 14', () => {
  beforeEach(() => {
    state.main._version = 13

    state.main.networks.ethereum = {
      137: {
        id: 1,
        type: 'ethereum',
        layer: 'sidechain',
        symbol: 'MATIC',
        name: 'Polygon',
        connection: {
          primary: {
            on: true,
            current: 'matic'
          },
          secondary: {
            on: false,
            current: 'local'
          }
        }
      }
    }
  })

  const connectionPriorities = ['primary', 'secondary']

  connectionPriorities.forEach((priority) => {
    it(`updates the ${priority} polygon connection from matic to infura`, () => {
      state.main.networks.ethereum[137].connection[priority].current = 'matic'

      const updatedState = migrations.apply(state, 14)

      expect(updatedState.main.networks.ethereum[137].connection[priority].current).toBe('infura')

      // ensure other settings weren't changed
      expect(updatedState.main.networks.ethereum[137].connection[priority].on).toBe(
        state.main.networks.ethereum[137].connection[priority].on
      )
    })

    it(`does not update the ${priority} polygon connection if not matic`, () => {
      state.main.networks.ethereum[137].connection[priority].current = 'local'

      const updatedState = migrations.apply(state, 14)

      expect(updatedState.main.networks.ethereum[137].connection[priority].current).toBe('local')

      // ensure other settings weren't changed
      expect(updatedState.main.networks.ethereum[137].connection[priority].on).toBe(
        state.main.networks.ethereum[137].connection[priority].on
      )
    })
  })

  it('adds Arbitrum network information when none exists', () => {
    delete state.main.networks.ethereum[42161]

    const updatedState = migrations.apply(state, 14)

    const arbitrum = updatedState.main.networks.ethereum[42161]

    expect(arbitrum).toMatchObject({
      id: 42161,
      type: 'ethereum',
      layer: 'rollup',
      symbol: 'ETH',
      name: 'Arbitrum',
      explorer: 'https://explorer.arbitrum.io',
      gas: { price: { selected: 'standard', levels: {} } }
    })

    expect(arbitrum.connection.primary.on).toBe(true)
    expect(arbitrum.connection.primary.current).toBe('infura')
    expect(arbitrum.connection.secondary.on).toBe(false)
    expect(arbitrum.connection.secondary.current).toBe('custom')
    expect(arbitrum.on).toBe(false)
  })

  it('does not change existing Arbitrum network information', () => {
    state.main.networks.ethereum[42161] = {
      explorer: 'https://custom-explorer.arbitrum.io',
      connection: {
        primary: { on: true, current: 'local' }
      }
    }

    const updatedState = migrations.apply(state, 14)

    const arbitrum = updatedState.main.networks.ethereum[42161]

    expect(arbitrum.explorer).toBe('https://custom-explorer.arbitrum.io')
    expect(arbitrum.connection.primary.on).toBe(true)
    expect(arbitrum.connection.primary.current).toBe('local')
  })

  it('adds Arbitrum network meta information when none exists', () => {
    delete state.main.networksMeta.ethereum[42161]

    const updatedState = migrations.apply(state, 14)

    const arbitrum = updatedState.main.networksMeta.ethereum[42161]

    expect(arbitrum.gas.fees.maxFeePerGas).toBe(undefined)
    expect(arbitrum).toMatchObject({
      gas: { fees: {}, price: { selected: 'standard', levels: {} } }
    })
  })

  it('does not change existing Arbitrum meta network information', () => {
    state.main.networksMeta.ethereum[42161] = {
      gas: {
        fees: {
          maxFeePerGas: '0xf'
        }
      }
    }

    const updatedState = migrations.apply(state, 14)

    const arbitrum = updatedState.main.networksMeta.ethereum[42161]

    expect(arbitrum.gas.fees.maxFeePerGas).toBe('0xf')
  })
})

describe('migration 15', () => {
  beforeEach(() => {
    state.main._version = 14

    state.main.networks.ethereum = {
      137: {
        id: 1,
        type: 'ethereum',
        layer: 'sidechain',
        symbol: 'MATIC',
        name: 'Polygon',
        explorer: 'https://explorer.matic.network',
        connection: {
          primary: {
            on: true,
            current: 'matic'
          },
          secondary: {
            on: false,
            current: 'local'
          }
        }
      }
    }
  })

  it('updates the initial explorer for Polygon', () => {
    const updatedState = migrations.apply(state, 15)
    const polygon = updatedState.main.networks.ethereum['137']

    expect(polygon.explorer).toBe('https://polygonscan.com')
  })

  it('adds the Polygon explorer if one does not exist', () => {
    delete state.main.networks.ethereum['137'].explorer

    const updatedState = migrations.apply(state, 15)
    const polygon = updatedState.main.networks.ethereum['137']

    expect(polygon.explorer).toBe('https://polygonscan.com')
  })

  it('does not update the Polygon explorer if it has been manually changed', () => {
    state.main.networks.ethereum['137'].explorer = 'https://custom-explorer.io'

    const updatedState = migrations.apply(state, 15)
    const polygon = updatedState.main.networks.ethereum['137']

    expect(polygon.explorer).toBe('https://custom-explorer.io')
  })
})

describe('migration 16', () => {
  beforeEach(() => {
    state.main._version = 15

    state.main.currentNetwork = {
      type: 'ethereum',
      id: '1'
    }

    state.main.networks.ethereum = {
      137: {
        id: '137',
        type: 'ethereum',
        layer: 'sidechain',
        symbol: 'MATIC',
        name: 'Polygon',
        explorer: 'https://explorer.matic.network',
        connection: {
          primary: {
            on: true,
            current: 'matic'
          },
          secondary: {
            on: false,
            current: 'local'
          }
        }
      }
    }
  })

  it('converts string ids to numbers', () => {
    const updatedState = migrations.apply(state, 16)
    const polygon = updatedState.main.networks.ethereum[137]
    expect(polygon.id).toBe(137)
  })

  it('converts current id to number', () => {
    const updatedState = migrations.apply(state, 16)
    const id = updatedState.main.currentNetwork.id
    expect(id).toBe(1)
  })
})

describe('migration 17', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 16,
        lattice: {
          McBbS7: {
            deviceId: 'McBbS7'
          }
        },
        latticeSettings: {
          suffix: 'my-laptop'
        }
      }
    }
  })

  it('handles no Lattices to migrate', () => {
    delete state.main.lattice

    const updatedState = migrations.apply(state, 17)
    expect(updatedState.main.lattice).toBe(undefined)
  })

  it('adds paired state to existing Lattices', () => {
    const updatedState = migrations.apply(state, 17)

    const lattice = updatedState.main.lattice['McBbS7']
    expect(lattice.paired).toBe(true)
  })

  it('sets the device name of existing Lattices to be "GridPlus"', () => {
    const updatedState = migrations.apply(state, 17)

    const lattice = updatedState.main.lattice['McBbS7']
    expect(lattice.deviceName).toBe('GridPlus')
  })

  it('sets the tag of an existing Lattice to the old suffix', () => {
    const updatedState = migrations.apply(state, 17)

    const lattice = updatedState.main.lattice['McBbS7']
    expect(lattice.tag).toBe('my-laptop')
  })

  it('sets an empty tag on an existing Lattice with no suffix', () => {
    delete state.main.latticeSettings.suffix

    const updatedState = migrations.apply(state, 17)

    const lattice = updatedState.main.lattice['McBbS7']
    expect(lattice.tag).toBe('')
  })
})

describe('migration 18', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 17,
        tokens: ['AVAX', 'OHM']
      }
    }
  })

  it('migrates tokens to custom tokens', () => {
    state.main.tokens = ['AVAX', 'OHM']

    const updatedState = migrations.apply(state, 18)
    expect(updatedState.main.tokens).toEqual({ custom: ['AVAX', 'OHM'] })
  })

  it('migrates no custom tokens to an empty array', () => {
    state.main.tokens = []

    const updatedState = migrations.apply(state, 18)

    expect(updatedState.main.tokens).toEqual({ custom: [] })
  })

  it('migrates missing custom tokens to an empty array', () => {
    state.main.tokens = undefined

    const updatedState = migrations.apply(state, 18)

    expect(updatedState.main.tokens).toEqual({ custom: [] })
  })
})

describe('migration 19', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 18,
        currentNetwork: {
          id: 1,
          type: 'ethereum'
        },
        clients: {
          ipfs: {},
          geth: {},
          parity: {}
        }
      }
    }
  })

  it('should delete main.currentNetwork', () => {
    const updatedState = migrations.apply(state, 19)
    expect(updatedState.main.currentNetwork).toBeUndefined()
  })

  it('should delete main.clients', () => {
    const updatedState = migrations.apply(state, 19)
    expect(updatedState.main.clients).toBeUndefined()
  })
})

describe('migration 20', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 19,
        mute: {
          aragonAccountMigrationWarning: true
        },
        accounts: {
          test: {
            smart: {
              type: 'aragon'
            }
          }
        }
      }
    }
  })

  it('should add the mainnet chain to Aragon accounts', () => {
    const updatedState = migrations.apply(state, 20)
    expect(updatedState.main.accounts.test.smart.chain).toEqual({ id: 1, type: 'ethereum' })
  })

  it('should add a warning if an Aragon account was migrated', () => {
    const updatedState = migrations.apply(state, 20)
    expect(updatedState.main.mute.aragonAccountMigrationWarning).toBe(false)
  })

  it('should not migrate non-Aragon smart accounts', () => {
    state.main.accounts.test.smart.type = 'gnosis'

    const updatedState = migrations.apply(state, 20)
    expect(updatedState.main.accounts.test.smart.chain).toBe(undefined)
  })

  it('should not add a warning if no accounts were migrated', () => {
    state.main.accounts.test.smart.chain = { id: 137, type: 'ethereum' }

    const updatedState = migrations.apply(state, 20)
    expect(updatedState.main.mute.aragonAccountMigrationWarning).toBe(true)
  })
})

describe('migration 21', () => {
  beforeEach(() => {
    state.main._version = 20

    state.main.networkPresets = { ethereum: {} }

    state.main.networks.ethereum = {
      5: {
        id: 5,
        type: 'ethereum',
        layer: 'testnet',
        symbol: 'ETH',
        name: 'Görli',
        explorer: 'https://goerli.etherscan.io',
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        },
        connection: {
          primary: {
            on: true,
            current: 'infura',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        },
        on: false
      }
    }
  })

  it('adds Sepolia network information when none exists', () => {
    delete state.main.networks.ethereum[11155111]

    const updatedState = migrations.apply(state, 21)

    const sepolia = updatedState.main.networks.ethereum[11155111]

    expect(sepolia).toMatchObject({
      id: 11155111,
      type: 'ethereum',
      layer: 'testnet',
      symbol: 'ETH',
      name: 'Sepolia',
      explorer: 'https://sepolia.etherscan.io',
      gas: { price: { selected: 'standard', levels: {} } }
    })

    expect(sepolia.connection.primary.on).toBe(true)
    expect(sepolia.connection.primary.current).toBe('infura')
    expect(sepolia.connection.secondary.on).toBe(false)
    expect(sepolia.connection.secondary.current).toBe('custom')
    expect(sepolia.on).toBe(false)
  })

  it('does not change existing Sepolia network information', () => {
    state.main.networks.ethereum[11155111] = {
      explorer: 'https://custom-explorer.sepolia.dev',
      connection: {
        primary: { on: true, current: 'local' }
      }
    }

    const updatedState = migrations.apply(state, 21)
    const sepolia = updatedState.main.networks.ethereum[11155111]

    expect(sepolia.explorer).toBe('https://custom-explorer.sepolia.dev')
    expect(sepolia.connection.primary.on).toBe(true)
    expect(sepolia.connection.primary.current).toBe('local')
  })

  it('adds Sepolia network meta information when none exists', () => {
    delete state.main.networksMeta.ethereum[11155111]

    const updatedState = migrations.apply(state, 21)
    const sepolia = updatedState.main.networksMeta.ethereum[11155111]

    expect(sepolia.gas.fees.maxFeePerGas).toBe(undefined)
    expect(sepolia).toMatchObject({
      gas: { fees: {}, price: { selected: 'standard', levels: {} } }
    })
  })

  it('does not change existing Sepolia meta network information', () => {
    state.main.networksMeta.ethereum[11155111] = {
      gas: {
        fees: {
          maxFeePerGas: '0xf'
        }
      }
    }

    const updatedState = migrations.apply(state, 21)
    const sepolia = updatedState.main.networksMeta.ethereum[11155111]

    expect(sepolia.gas.fees.maxFeePerGas).toBe('0xf')
  })

  const removedGoerliRPCs = ['mudit', 'slockit', 'prylabs']

  removedGoerliRPCs.forEach((removedRPCName) => {
    it(`resets the primary connection when the ${removedRPCName} RPC is selected`, () => {
      state.main.networks.ethereum[5].connection.primary = {
        on: true,
        current: removedRPCName,
        status: 'disconnected',
        connected: false,
        type: '',
        network: '',
        custom: ''
      }

      const updatedState = migrations.apply(state, 21)
      const goerli = updatedState.main.networks.ethereum[5]

      expect(goerli.connection.primary).toMatchObject({
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      })
    })

    it(`resets the secondary connection when the ${removedRPCName} RPC is selected`, () => {
      state.main.networks.ethereum[5].connection.primary = {
        on: true,
        current: removedRPCName,
        status: 'disconnected',
        connected: false,
        type: '',
        network: '',
        custom: ''
      }

      const updatedState = migrations.apply(state, 21)
      const goerli = updatedState.main.networks.ethereum[5]

      expect(goerli.connection.secondary).toMatchObject({
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      })
    })
  })

  it('turns off goerli if the primary connection was reset whilst the secondary connection is inactive', () => {
    state.main.networks.ethereum[5].connection.primary = {
      on: false,
      current: 'prylabs',
      status: 'disconnected',
      connected: false,
      type: '',
      network: '',
      custom: ''
    }
    state.main.networks.ethereum[5].connection.secondary = {
      on: false,
      current: 'infura',
      status: 'loading',
      connected: false,
      type: '',
      network: '',
      custom: ''
    }

    const updatedState = migrations.apply(state, 21)
    const goerli = updatedState.main.networks.ethereum[5]

    expect(goerli.on).toBe(false)
  })

  it('turns off goerli if the secondary connection was reset whilst the primary connection is inactive', () => {
    state.main.networks.ethereum[5].connection.primary = {
      on: false,
      current: 'infura',
      status: 'loading',
      connected: false,
      type: '',
      network: '',
      custom: ''
    }
    state.main.networks.ethereum[5].connection.secondary = {
      on: false,
      current: 'prylabs',
      status: 'disconnected',
      connected: false,
      type: '',
      network: '',
      custom: ''
    }

    const updatedState = migrations.apply(state, 21)
    const goerli = updatedState.main.networks.ethereum[5]

    expect(goerli.on).toBe(false)
  })

  it('turns off goerli if both connections were reset', () => {
    state.main.networks.ethereum[5].connection.primary = {
      on: true,
      current: 'mudit',
      status: 'connected',
      connected: true,
      type: '',
      network: '',
      custom: ''
    }
    state.main.networks.ethereum[5].connection.secondary = {
      on: false,
      current: 'prylabs',
      status: 'disconnected',
      connected: false,
      type: '',
      network: '',
      custom: ''
    }

    const updatedState = migrations.apply(state, 21)
    const goerli = updatedState.main.networks.ethereum[5]

    expect(goerli.on).toBe(false)
  })

  it('takes no action on goerli if the chain is not present', () => {
    delete state.main.networks.ethereum[5]

    const updatedState = migrations.apply(state, 21)

    expect(Object.keys(updatedState.main.networks.ethereum)).toEqual(['11155111'])
  })
})

describe('migration 22', () => {
  beforeEach(() => {
    state.main._version = 21

    state.main.networks.ethereum = {
      1: {
        layer: 'mainnet'
      },
      5: {
        layer: 'testnet'
      }
    }
  })

  it('sets the isTestnet flag to false on a non-testnet', () => {
    const updatedState = migrations.apply(state, 22)

    expect(updatedState.main.networks.ethereum[1].isTestnet).toBe(false)
  })

  it('sets the isTestnet flag to true on a testnet', () => {
    const updatedState = migrations.apply(state, 22)

    expect(updatedState.main.networks.ethereum[5].isTestnet).toBe(true)
  })
})

describe('migration 23', () => {
  beforeEach(() => {
    state.main._version = 22

    state.main.networksMeta.ethereum = {
      1: {}, // Mainnet
      3: {}, // Known Testnet
      4: {}, // Known Testnet
      5: {}, // Known Testnet
      10: {}, // Optimism
      42: {}, // Known Testnet
      100: {}, // Gnosis
      137: {}, // Polygon
      8888: {}, // Unknown Chain
      42161: {}, // Arbitrum
      11155111: {} // Known Testnet
    }
  })

  it('sets the icon value on a chain', () => {
    const updatedState = migrations.apply(state, 23)
    const chains = updatedState.main.networksMeta.ethereum
    expect(chains[1].icon).toBe('')
    expect(chains[3].icon).toBe('')
    expect(chains[4].icon).toBe('')
    expect(chains[5].icon).toBe('')
    expect(chains[10].icon).toBe('https://frame.nyc3.cdn.digitaloceanspaces.com/icons/optimism.svg')
    expect(chains[42].icon).toBe('')
    expect(chains[100].icon).toBe('https://frame.nyc3.cdn.digitaloceanspaces.com/icons/gnosis.svg')
    expect(chains[137].icon).toBe('https://frame.nyc3.cdn.digitaloceanspaces.com/icons/polygon.svg')
    expect(chains[8888].icon).toBe('')
    expect(chains[42161].icon).toBe('https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg')
    expect(chains[11155111].icon).toBe('')
  })

  it('sets the primaryColor value on a chain', () => {
    const updatedState = migrations.apply(state, 23)
    const chains = updatedState.main.networksMeta.ethereum
    expect(chains[1].primaryColor).toBe('accent1')
    expect(chains[3].primaryColor).toBe('accent2')
    expect(chains[4].primaryColor).toBe('accent2')
    expect(chains[5].primaryColor).toBe('accent2')
    expect(chains[10].primaryColor).toBe('accent4')
    expect(chains[42].primaryColor).toBe('accent2')
    expect(chains[100].primaryColor).toBe('accent5')
    expect(chains[137].primaryColor).toBe('accent6')
    expect(chains[8888].primaryColor).toBe('accent3')
    expect(chains[42161].primaryColor).toBe('accent7')
    expect(chains[11155111].primaryColor).toBe('accent2')
  })
})

describe('migration 24', () => {
  beforeEach(() => {
    state.main._version = 23

    state.main.networksMeta.ethereum = { 1: {} }
  })

  it('sets the nativeCurrency value on a chain', () => {
    const updatedState = migrations.apply(state, 24)
    const chains = updatedState.main.networksMeta.ethereum

    expect(chains[1].nativeCurrency).toStrictEqual({
      usd: { price: 0, change24hr: 0 },
      icon: '',
      name: '',
      symbol: '',
      decimals: 0
    })
  })

  it('does not set the nativeCurrency value on a chain when it already exists', () => {
    state.main.networksMeta.ethereum[1] = {
      nativeCurrency: {
        usd: {
          price: 1324.43,
          change24hr: 2.375239369802938
        },
        icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
        name: 'Ether'
      }
    }
    const updatedState = migrations.apply(state, 24)
    const chains = updatedState.main.networksMeta.ethereum

    expect(chains[1].nativeCurrency).toStrictEqual({
      usd: {
        price: 1324.43,
        change24hr: 2.375239369802938
      },
      icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
      name: 'Ether'
    })
  })
})

describe('migration 25', () => {
  beforeEach(() => {
    state.main._version = 24

    state.main.networks.ethereum = {
      10: {
        connection: {
          primary: { current: 'custom' },
          secondary: { current: 'local' }
        }
      }
    }
  })

  const connectionPriorities = ['primary', 'secondary']

  connectionPriorities.forEach((priority) => {
    it(`updates a ${priority} optimism connection to Infura`, () => {
      state.main.networks.ethereum[10].connection[priority].current = 'optimism'

      const updatedState = migrations.apply(state, 25)
      const optimism = updatedState.main.networks.ethereum[10]

      expect(optimism.connection[priority].current).toBe('infura')
    })

    it(`does not update an existing custom ${priority} optimism connection`, () => {
      state.main.networks.ethereum[10].connection[priority].current = 'custom'

      const updatedState = migrations.apply(state, 25)
      const optimism = updatedState.main.networks.ethereum[10]

      expect(optimism.connection[priority].current).toBe('custom')
    })

    it('takes no action if no Optimism chain is present', () => {
      delete state.main.networks.ethereum[10]

      const updatedState = migrations.apply(state, 25)

      expect(updatedState.main.networks).toStrictEqual({ ethereum: {} })
    })
  })
})

describe('migration 26', () => {
  beforeEach(() => {
    state.main._version = 25

    state.main.networks.ethereum = {
      5: {
        id: 5,
        type: 'ethereum',
        layer: 'testnet',
        symbol: 'ETH',
        name: 'Görli'
      }
    }

    state.main.networksMeta.ethereum = {
      5: {
        nativeCurrency: {
          symbol: 'ETH'
        }
      }
    }
  })

  it('removes the symbol property on a network', () => {
    const updatedState = migrations.apply(state, 26)
    const networks = updatedState.main.networks.ethereum
    const metadata = updatedState.main.networksMeta.ethereum
    expect(networks[5].symbol).toBeFalsy()
    expect(metadata[5].nativeCurrency.symbol).toBe('ETH')
  })
})

describe('migration 27', () => {
  beforeEach(() => {
    state.main._version = 26
  })

  const address = '0x87c6418C2A3D6d502C85ed4454cAaDA0BD664AbA'
  const accountTypes = ['seed', 'ring']

  accountTypes.forEach((type) => {
    it(`migrates a ${type} account to be called a hot account`, () => {
      state.main.accounts[address] = {
        name: `${capitalize(type)} Account`
      }

      const updatedState = migrations.apply(state, 27)

      expect(updatedState.main.accounts[address].name).toBe('Hot Account')
    })
  })

  it('does not migrate an account with a changed name', () => {
    state.main.accounts[address] = {
      name: `My Kewl Account`
    }

    const updatedState = migrations.apply(state, 27)

    expect(updatedState.main.accounts[address].name).toBe('My Kewl Account')
  })
})

describe('migration 28', () => {
  beforeEach(() => {
    state.main._version = 27

    state.main.networksMeta.ethereum = {
      5: {
        nativeCurrency: {
          symbol: 'ETH',
          decimals: 0
        }
      },
      11155111: {
        nativeCurrency: {
          symbol: 'ETH',
          decimals: 18
        }
      }
    }
  })

  it('updates the symbol for Sepolia testnet if it is currently ETH', () => {
    const updatedState = migrations.apply(state, 28)
    const metadata = updatedState.main.networksMeta.ethereum
    expect(metadata[11155111].nativeCurrency.symbol).toBe('sepETH')
  })

  it('updates the symbol for Gorli testnet if it is currently ETH', () => {
    const updatedState = migrations.apply(state, 28)
    const metadata = updatedState.main.networksMeta.ethereum
    expect(metadata[5].nativeCurrency.symbol).toBe('görETH')
  })

  it('does not update the symbol for Gorli testnet if it is not ETH', () => {
    state.main.networksMeta.ethereum[5].nativeCurrency.symbol = 'CUSTOM'
    const updatedState = migrations.apply(state, 28)
    const metadata = updatedState.main.networksMeta.ethereum
    expect(metadata[5].nativeCurrency.symbol).toBe('CUSTOM')
  })

  it('does not update the symbol for Sepolia testnet if it is not ETH', () => {
    state.main.networksMeta.ethereum[11155111].nativeCurrency.symbol = 'CUSTOM'
    const updatedState = migrations.apply(state, 28)
    const metadata = updatedState.main.networksMeta.ethereum
    expect(metadata[11155111].nativeCurrency.symbol).toBe('CUSTOM')
  })

  it('updates decimals to 18 if they are currently 0', () => {
    const updatedState = migrations.apply(state, 28)
    const metadata = updatedState.main.networksMeta.ethereum
    expect(metadata[5].nativeCurrency.decimals).toBe(18)
  })

  it('takes no action on Goerli if the chain is not present', () => {
    delete state.main.networksMeta.ethereum[5]

    const updatedState = migrations.apply(state, 28)

    expect(Object.keys(updatedState.main.networksMeta.ethereum)).toEqual(['11155111'])
  })

  it('takes no action on Sepolia if the chain is not present', () => {
    delete state.main.networksMeta.ethereum[11155111]

    const updatedState = migrations.apply(state, 28)

    expect(Object.keys(updatedState.main.networksMeta.ethereum)).toEqual(['5'])
  })
})

describe('migration 29', () => {
  beforeEach(() => {
    state.main._version = 28

    state.main.accounts = {
      test: {
        name: 'my test account',
        lastSignerType: 'ledger'
      },
      look: {
        name: 'such a cool account',
        lastSignerType: 'ledger'
      }
    }

    jest.setSystemTime(new Date('2022-11-17T11:01:58.135Z'))
  })

  it('adds the existing account names to accountsMeta under hashed keys with a timestamp', () => {
    const updatedState = migrations.apply(state, 29)
    const { accountsMeta } = updatedState.main

    expect(accountsMeta).toStrictEqual({
      '6ae9081b-ba1c-54a5-a985-20e180d6fa9f': {
        name: 'such a cool account',
        lastUpdated: 1668682918135
      },
      'c7b2d7b1-b0cc-5706-b708-cbc09b0bb7bf': {
        name: 'my test account',
        lastUpdated: 1668682918135
      }
    })
  })

  it('does not add an account with a default name', () => {
    state.main.accounts.test = {
      name: getDefaultAccountName('ledger'),
      lastSignerType: 'ledger'
    }
    const updatedState = migrations.apply(state, 29)
    const { accountsMeta } = updatedState.main

    expect(accountsMeta).toStrictEqual({
      '6ae9081b-ba1c-54a5-a985-20e180d6fa9f': {
        name: 'such a cool account',
        lastUpdated: 1668682918135
      }
    })
  })

  it('does not add a watch account with the previous default name', () => {
    state.main.accounts.test = {
      name: 'Address Account',
      lastSignerType: 'address'
    }
    const updatedState = migrations.apply(state, 29)
    const { accountsMeta } = updatedState.main

    expect(accountsMeta).toStrictEqual({
      '6ae9081b-ba1c-54a5-a985-20e180d6fa9f': {
        name: 'such a cool account',
        lastUpdated: 1668682918135
      }
    })
  })
})

describe('migration 30', () => {
  const address = '0xFeebabE6b0418eC13b30aAdF129F5DcDd4f70CeA'

  const existingAccount = {
    name: 'my test aragon dao',
    created: 'new:1670583718135',
    lastSignerType: 'aragon',
    smart: {
      type: 'aragon',
      actor: 'my acting account',
      dao: '0x0c188b183ff758500d1d18b432313d10e9f6b8a4',
      agent: address
    }
  }

  beforeEach(() => {
    state = {
      main: {
        _version: 29,
        accounts: {
          [address]: existingAccount
        }
      }
    }
  })

  it('should migrate existing aragon accounts to watch only', () => {
    const updatedState = migrations.apply(state, 30)
    const { accounts } = updatedState.main

    expect(accounts[address]).toStrictEqual({
      id: address,
      name: existingAccount.name,
      address,
      lastSignerType: 'address',
      created: existingAccount.created,
      status: 'ok',
      active: false,
      signer: '',
      requests: {},
      ensName: '',
      balances: {}
    })
  })

  it('should not migrate non-aragon accounts', () => {
    state.main.accounts['test dao agent address'] = {
      name: 'not really an aragon dao'
    }

    const updatedState = migrations.apply(state, 30)
    const { accounts } = updatedState.main

    expect(accounts['test dao agent address']).toStrictEqual({
      name: 'not really an aragon dao'
    })
  })
})

describe('migration 31', () => {
  const address = '0xFeebabE6b0418eC13b30aAdF129F5DcDd4f70CeA'

  const existingBalances = [
    {
      chainId: 10,
      address: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoURI: 'https://ethereum-optimism.github.io/data/ETH/logo.svg',
      balance: '0x02ab5fa692c56d4000',
      displayBalance: '49.24226'
    },
    {
      balance: '0x0',
      displayBalance: '0',
      chainId: 80001,
      symbol: 'MATIC',
      address: '0x0000000000000000000000000000000000000000'
    },
    {
      chainId: 1,
      address: '0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc',
      name: 'Hop Protocol',
      symbol: 'HOP',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/25445/thumb/hop.png?1665541677',
      balance: '0x0e0cd1012ac685f714',
      displayBalance: '259.177937713752307476'
    }
  ]

  beforeEach(() => {
    state = {
      main: {
        _version: 30,
        balances: {
          [address]: existingBalances
        }
      }
    }
  })

  it('remove any balances which have the address `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000`', () => {
    const updatedState = migrations.apply(state, 31)
    const { balances } = updatedState.main

    expect(
      balances[address].find((balance) => balance.address === '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000')
    ).toBeFalsy()
  })

  it('should not remove any other balances', () => {
    const updatedState = migrations.apply(state, 31)
    const { balances } = updatedState.main

    expect(balances[address]).toStrictEqual([
      {
        balance: '0x0',
        displayBalance: '0',
        chainId: 80001,
        symbol: 'MATIC',
        address: '0x0000000000000000000000000000000000000000'
      },
      {
        chainId: 1,
        address: '0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc',
        name: 'Hop Protocol',
        symbol: 'HOP',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/25445/thumb/hop.png?1665541677',
        balance: '0x0e0cd1012ac685f714',
        displayBalance: '259.177937713752307476'
      }
    ])
  })
})

describe('migration 32', () => {
  const getKnownTokens = (state) => state.main.tokens.known[account]
  const account = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'

  beforeEach(() => {
    state.main._version = 31

    state.main.networksMeta.ethereum = {
      100: {
        nativeCurrency: {
          symbol: 'ETH',
          decimals: 0,
          name: ''
        }
      },
      137: {
        nativeCurrency: {
          symbol: 'ETH',
          decimals: 18,
          name: ''
        }
      }
    }

    state.main.tokens.known[account] = [
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      },
      {
        address: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000'
      }
    ]
  })

  it('should remove any known tokens with the address `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000`', () => {
    const updatedState = migrations.apply(state, 32)
    const known = getKnownTokens(updatedState)
    expect(known.find(({ address }) => address === '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000')).toBeFalsy()
  })

  it('should set known tokens as an empty object if currently undefined', () => {
    delete state.main.tokens.known
    const newState = migrations.apply(state, 32)
    expect(newState.main.tokens.known).toEqual({})
  })

  it('should not remove any other known tokens', () => {
    const oldKnown = getKnownTokens(state)
    const updatedState = migrations.apply(state, 32)
    const updatedKnown = getKnownTokens(updatedState)

    expect(updatedKnown.length).toBe(oldKnown.length - 1)
  })
})

describe('migration 34', () => {
  const getNativeCurrency = (state, chainId) => state.main.networksMeta.ethereum[chainId].nativeCurrency

  const expectedData = {
    1: {
      chainName: 'Mainnet',
      currencyName: 'Ether',
      currencySymbol: 'ETH'
    },
    5: {
      chainName: 'Görli',
      currencyName: 'Görli Ether',
      currencySymbol: 'görETH'
    },
    10: {
      chainName: 'Optimism',
      currencyName: 'Ether',
      currencySymbol: 'ETH'
    },
    100: {
      chainName: 'Gnosis',
      currencyName: 'xDAI',
      currencySymbol: 'xDAI'
    },
    137: {
      chainName: 'Polyon',
      currencyName: 'Matic',
      currencySymbol: 'MATIC'
    },
    42161: {
      chainName: 'Arbitrum',
      currencyName: 'Ether',
      currencySymbol: 'ETH'
    },
    11155111: {
      chainName: 'Sepolia',
      currencyName: 'Sepolia Ether',
      currencySymbol: 'sepETH'
    }
  }

  beforeEach(() => {
    state.main._version = 33
  })

  Object.entries(expectedData).forEach(([chainId, { chainName, currencyName, currencySymbol }]) => {
    it(`should set the native currency name for ${chainName} to ${currencyName} if currently undefined`, () => {
      createChainState(chainId)

      const updatedState = migrations.apply(state, 34)
      expect(getNativeCurrency(updatedState, chainId).name).toBe(currencyName)
    })

    it(`should set the native currency name for ${chainName} to ${currencyName} if currently an empty string'`, () => {
      createChainState(chainId)
      state.main.networksMeta.ethereum[chainId].nativeCurrency.name = ''

      const updatedState = migrations.apply(state, 34)
      expect(getNativeCurrency(updatedState, chainId).name).toBe(currencyName)
    })

    it(`should set the native currency symbol for ${chainName} to ${currencySymbol} if currently not set`, () => {
      createChainState(chainId)

      const updatedState = migrations.apply(state, 34)
      expect(getNativeCurrency(updatedState, chainId).symbol).toBe(currencySymbol)
    })
  })

  const fields = ['name', 'symbol']

  fields.forEach((field) => {
    it(`should not overwrite an existing native currency ${field}`, () => {
      createChainState(10)
      state.main.networksMeta.ethereum[10].nativeCurrency[field] = 'CUSTOM'

      const updatedState = migrations.apply(state, 34)
      expect(getNativeCurrency(updatedState, 10)[field]).toBe('CUSTOM')
    })

    it(`should set a missing custom chain native currency ${field} to an empty string`, () => {
      createChainState(56)

      const updatedState = migrations.apply(state, 34)
      expect(getNativeCurrency(updatedState, 56)[field]).toBe('')
    })
  })

  it('should set native currency data when no chain metadata previously existed', () => {
    state.main.networks.ethereum[10] = { id: 10 }

    const updatedState = migrations.apply(state, 34)
    expect(getNativeCurrency(updatedState, 10)).toStrictEqual({ name: 'Ether', symbol: 'ETH' })
  })

  it('should set native currency data when none previously existed', () => {
    createChainState(137)
    delete state.main.networksMeta.ethereum[137].nativeCurrency

    const updatedState = migrations.apply(state, 34)
    expect(getNativeCurrency(updatedState, 137)).toStrictEqual({ name: 'Matic', symbol: 'MATIC' })
  })
})

describe('migration 35', () => {
  beforeEach(() => {
    state.main._version = 34
  })

  const providers = ['infura', 'alchemy']

  const pylonChains = [
    [1, 'Mainnet'],
    [5, 'Goerli'],
    [10, 'Optimism'],
    [137, 'Polygon'],
    [42161, 'Arbitrum'],
    [11155111, 'Sepolia']
  ]

  pylonChains.forEach(([id, chainName]) => {
    providers.forEach((provider) => {
      it(`should migrate a primary ${chainName} ${provider} connection to use Pylon`, () => {
        createChainState(id)
        state.main.networks.ethereum[id].connection = {
          primary: { current: provider, on: true, connected: false },
          secondary: { current: 'custom', on: false, connected: false }
        }

        const updatedState = migrations.apply(state, 35)

        const {
          connection: { primary, secondary }
        } = updatedState.main.networks.ethereum[id]

        expect(primary.current).toBe('pylon')
        expect(secondary.current).toBe('custom')
      })

      it(`should migrate a secondary ${chainName} ${provider} connection to use Pylon`, () => {
        createChainState(id)
        state.main.networks.ethereum[id].connection = {
          primary: { current: 'local', on: true, connected: false },
          secondary: { current: provider, on: false, connected: false }
        }

        const updatedState = migrations.apply(state, 35)

        const {
          connection: { primary, secondary }
        } = updatedState.main.networks.ethereum[id]

        expect(primary.current).toBe('local')
        expect(secondary.current).toBe('pylon')
      })
    })
  })

  // these chains will not be supported by Pylon
  const retiredChains = [
    [3, 'Ropsten'],
    [4, 'Rinkeby'],
    [42, 'Kovan']
  ]

  retiredChains.forEach(([id, chainName]) => {
    providers.forEach((provider) => {
      it(`should remove a primary ${chainName} ${provider} connection`, () => {
        createChainState(id)
        state.main.networks.ethereum[id].connection = {
          primary: { current: provider, on: true, connected: false },
          secondary: { current: 'custom', on: false, connected: false }
        }

        const updatedState = migrations.apply(state, 35)

        const {
          connection: { primary }
        } = updatedState.main.networks.ethereum[id]

        expect(primary.current).toBe('custom')
        expect(primary.on).toBe(false)
      })

      it(`should remove a secondary ${chainName} ${provider} connection`, () => {
        createChainState(id)
        state.main.networks.ethereum[id].connection = {
          primary: { current: 'local', on: true, connected: false },
          secondary: { current: provider, on: false, connected: false }
        }

        const updatedState = migrations.apply(state, 35)

        const {
          connection: { secondary }
        } = updatedState.main.networks.ethereum[id]

        expect(secondary.current).toBe('custom')
        expect(secondary.on).toBe(false)
      })
    })
  })

  it('should not migrate an existing custom infura connection on a Pylon chain', () => {
    createChainState(10)
    state.main.networks.ethereum[10].connection = {
      primary: {
        current: 'custom',
        custom: 'https://optimism-mainnet.infura.io/v3/myapikey',
        on: true,
        connected: false
      },
      secondary: { current: 'custom', on: false, connected: false }
    }

    const updatedState = migrations.apply(state, 35)

    const {
      connection: { primary, secondary }
    } = updatedState.main.networks.ethereum[10]

    expect(primary.current).toBe('custom')
    expect(primary.on).toBe(true)
    expect(primary.custom).toBe('https://optimism-mainnet.infura.io/v3/myapikey')
    expect(secondary.current).toBe('custom')
  })
})

describe('migration 36', () => {
  beforeEach(() => {
    state.main._version = 35

    state.main.networks.ethereum = {
      100: {
        connection: {
          primary: { current: 'custom' },
          secondary: { current: 'local' }
        }
      }
    }
  })

  const connectionPriorities = ['primary', 'secondary']

  connectionPriorities.forEach((priority) => {
    it(`updates a ${priority} Gnosis connection`, () => {
      state.main.networks.ethereum[100].connection[priority].current = 'poa'

      const updatedState = migrations.apply(state, 36)
      const gnosis = updatedState.main.networks.ethereum[100]

      expect(gnosis.connection[priority].current).toBe('custom')
      expect(gnosis.connection[priority].custom).toBe('https://rpc.gnosischain.com')
    })

    it(`does not update an existing custom ${priority} Gnosis connection`, () => {
      state.main.networks.ethereum[100].connection[priority].current = 'custom'
      state.main.networks.ethereum[100].connection[priority].custom = 'https://myconnection.io'

      const updatedState = migrations.apply(state, 36)
      const optimism = updatedState.main.networks.ethereum[100]

      expect(optimism.connection[priority].current).toBe('custom')
      expect(optimism.connection[priority].custom).toBe('https://myconnection.io')
    })
  })

  it('takes no action if no Gnosis chain is present', () => {
    delete state.main.networks.ethereum[100]

    const updatedState = migrations.apply(state, 36)

    expect(updatedState.main.networks).toStrictEqual({ ethereum: {} })
  })
})
