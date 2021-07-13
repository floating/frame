const migrations = require('../../../../main/store/migrations')

describe('migration 13', () => {
  let state

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
    const updatedState = migrations.apply(state)

    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.selected')
    expect(updatedState.main.networksMeta.ethereum[1]).toHaveProperty('gas.price.levels')
  })

  it('adds default gas price info', () => {
    state.main.networksMeta.ethereum = {
      1: { }
    }

    const updatedState = migrations.apply(state)

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

    const updatedState = migrations.apply(state)

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

    const updatedState = migrations.apply(state);

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

    const updatedState = migrations.apply(state)

    expect(updatedState.main.networksMeta.ethereum[1].gas.price.selected).toBe('asap')
    expect(updatedState.main.networksMeta.ethereum[1].gas.price.levels.slow).toBe('0x0a93')
  })
})