import log from 'electron-log'
import migrations from '../../../../main/store/migrations'

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
          ethereum: { }
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
      1: { }
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

    const updatedState = migrations.apply(state, 13);

    ['slow', 'standard', 'fast', 'asap', 'custom'].forEach(level => {
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
          ethereum: { }
        }
      }
    }
  })

  const connectionPriorities = ['primary', 'secondary']

  connectionPriorities.forEach(priority => {
    it(`updates the ${priority} polygon connection from matic to infura`, () => {
      state.main.networks.ethereum[137].connection[priority].current = 'matic'
  
      const updatedState = migrations.apply(state, 14)
  
      expect(updatedState.main.networks.ethereum[137].connection[priority].current).toBe('infura')

      // ensure other settings weren't changed
      expect(updatedState.main.networks.ethereum[137].connection[priority].on)
        .toBe(state.main.networks.ethereum[137].connection[priority].on)
    })
  
    it(`does not update the ${priority} polygon connection if not matic`, () => {
      state.main.networks.ethereum[137].connection[priority].current = 'local'
  
      const updatedState = migrations.apply(state, 14)
  
      expect(updatedState.main.networks.ethereum[137].connection[priority].current).toBe('local')

      // ensure other settings weren't changed
      expect(updatedState.main.networks.ethereum[137].connection[priority].on)
        .toBe(state.main.networks.ethereum[137].connection[priority].on)
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
      gas: { fees: {} , price: { selected: 'standard', levels: {} } }
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
          ethereum: { }
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

    expect(updatedState.main.tokens).toEqual({ custom: []})
  })

  it('migrates missing custom tokens to an empty array', () => {
    state.main.tokens = undefined

    const updatedState = migrations.apply(state, 18)

    expect(updatedState.main.tokens).toEqual({ custom: []})
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
          'test': {
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
                primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
                secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
              },
              on: false
            }
          }
        },
        networksMeta: {
          ethereum: { }
        },
        networkPresets: {
          ethereum: { }
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
      gas: { fees: {} , price: { selected: 'standard', levels: {} } }
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

  it('adds Sepolia network preset information when none exists', () => {
    delete state.main.networkPresets.ethereum[11155111]

    const updatedState = migrations.apply(state, 21)
    const sepolia = updatedState.main.networkPresets.ethereum[11155111]

    expect(sepolia).toMatchObject({
      infura: 'infuraSepolia'
    })
  })

  const removedGoerliRPCs = ['mudit', 'slockit', 'prylabs']

  removedGoerliRPCs.forEach((removedRPCName) => {
    it(`resets and turns off goerli when the ${removedRPCName} RPC is active as a primary connection`, () => {
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

      expect(goerli.connection).toMatchObject({
        primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
        secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
      })
      expect(goerli.on).toBe(false)
    })

    it(`resets and turns off goerli when the ${removedRPCName} RPC is active as a secondary connection`, () => {
      state.main.networks.ethereum[5].connection.secondary = { 
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

      expect(goerli.connection).toMatchObject({
        primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
        secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
      })
      expect(goerli.on).toBe(false)
    })
  })
})
