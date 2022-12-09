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

describe('migration 13', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 12,
        networks: {
          ethereum: {
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
        },
        networksMeta: {
          ethereum: {}
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
    state = {
      main: {
        _version: 13,
        networks: {
          ethereum: {
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
        },
        networksMeta: {
          ethereum: {}
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
    state = {
      main: {
        _version: 14,
        networks: {
          ethereum: {
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
        },
        networksMeta: {
          ethereum: {}
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
    state = {
      main: {
        _version: 15,
        currentNetwork: {
          type: 'ethereum',
          id: '1'
        },
        networks: {
          ethereum: {
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
        },
        networksMeta: {
          ethereum: {}
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
    state = {
      main: {
        _version: 20,
        networks: {
          ethereum: {
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
        },
        networksMeta: {
          ethereum: {}
        },
        networkPresets: {
          ethereum: {}
        }
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
})

describe('migration 22', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 21,
        networks: {
          ethereum: {
            1: {
              layer: 'mainnet'
            },
            5: {
              layer: 'testnet'
            }
          }
        }
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
    state = {
      main: {
        _version: 22,
        networksMeta: {
          ethereum: {
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
        }
      }
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
    state = {
      main: {
        _version: 23,
        networksMeta: {
          ethereum: {
            1: {}
          }
        }
      }
    }
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
    state = {
      main: {
        _version: 24,
        networks: {
          ethereum: {
            10: {
              connection: {
                primary: { current: 'custom' },
                secondary: { current: 'local' }
              }
            }
          }
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
  })
})

describe('migration 26', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 25,
        networks: {
          ethereum: {
            5: {
              id: 5,
              type: 'ethereum',
              layer: 'testnet',
              symbol: 'ETH',
              name: 'Görli'
            }
          }
        },
        networksMeta: {
          ethereum: {
            5: {
              nativeCurrency: {
                symbol: 'ETH'
              }
            }
          }
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
    state = {
      main: {
        _version: 26,
        accounts: {}
      }
    }
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
    state = {
      main: {
        _version: 27,
        networksMeta: {
          ethereum: {
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
})

describe('migration 29', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 28,
        accounts: {
          test: {
            name: 'my test account'
          },
          look: {
            name: 'such a cool account'
          }
        }
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

  const accountTypes = ['ring', 'seed', 'ledger', 'trezor', 'lattice', 'aragon']
  accountTypes.forEach((type) => {
    it(`does not add ${type} accounts with a default name`, () => {
      state.main.accounts.test = {
        name: getDefaultAccountName(type),
        lastSignerType: type
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
})

describe('migration 30', () => {
  beforeEach(() => {
    state = {
      main: {
        _version: 29,
        accounts: {
          'test dao agent address': {
            name: 'my test aragon dao',
            smart: {
              type: 'aragon',
              actor: 'my acting account',
              dao: '0x0c188b183ff758500d1d18b432313d10e9f6b8a4',
              agent: 'test dao agent address'
            }
          },
          look: {
            name: 'such a cool account'
          }
        }
      }
    }
    jest.setSystemTime(new Date('2022-12-09T11:01:58.135Z'))
  })

  it('should migrate existing aragon accounts to watch only with a timestamp', () => {
    const updatedState = migrations.apply(state, 30)
    const { accounts } = updatedState.main

    expect(accounts).toStrictEqual({
      'test dao agent address': {
        id: 'test dao agent address',
        name: 'my test aragon dao',
        address: 'test dao agent address',
        lastSignerType: 'address',
        created: 'new:1670583718135',
        status: 'ok',
        active: false,
        signer: '',
        requests: {},
        ensName: '',
        balances: {}
      },
      look: {
        name: 'such a cool account'
      }
    })
  })

  it('should not migrate non-aragon accounts', () => {
    state.main.accounts['test dao agent address'] = {
      name: 'not really an aragon dao'
    }
    const updatedState = migrations.apply(state, 30)
    const { accounts } = updatedState.main

    expect(accounts).toStrictEqual({
      'test dao agent address': {
        name: 'not really an aragon dao'
      },
      look: {
        name: 'such a cool account'
      }
    })
  })
})
