const { v5: uuidv5 } = require('uuid')

const persist = require('../persist')
const migrations = require('../migrations')

const latestStateVersion = () => {
  const state = persist.get('main')
  if (!state || !state.__) {
    // log.info('Persisted state: returning base state')
    return state 
  }

  // valid states are less than or equal to the latest migration we know about 
  const versions = Object.keys(state.__).filter(v => v <= migrations.latest).sort((a, b) => a - b)

  if (versions.length === 0) {
    // log.info('Persisted state: returning base state')
    return state
  }

  const latest = versions[versions.length - 1]
  // log.info('Persisted state: returning latest state version: ', latest)
  return state.__[latest].main
}

const get = (path, obj = latestStateVersion()) => {
  path.split('.').some((key, i) => {
    if (typeof obj !== 'object') { obj = undefined } else { obj = obj[key] }
    return obj === undefined // Stop navigating the path if we get to undefined value
  })
  return obj
}

const main = (path, def) => {
  const found = get(path)
  if (found === undefined) return def
  return found
}

const initial = {
  panel: { // Panel view
    show: false,
    view: 'default',
    account: {
      moduleOrder: [
        'launcher',
        'requests',
        // 'activity',
        'gas',
        'balances',
        'inventory',
        'permissions',
        'verify',
        'settings'
      ],
      modules: {
        requests: {
          height: 0
        },
        activity: {
          height: 0
        },
        balances: {
          height: 0
        },
        inventory: {
          height: 0
        },
        permissions: {
          height: 0
        },
        verify: {
          height: 0
        },
        launcher: {
          height: 0
        },
        gas: {
          height: 100
        }
      }
    }
  },
  dash: {
    type: 'signers',
    showing: false
  },
  flow: {},
  dapps: {},
  view: {
    current: '',
    list: [],
    data: {},
    notify: '',
    notifyData: {},
    badge: '',
    addAccount: '', // Add view (needs to be merged into Phase)
    addNetwork: false, // Phase view (needs to be merged with Add)
    clickGuard: false
  },
  signers: {},
  tray: {
    open: false,
    initial: true
  },
  balances: {},
  selected: {
    minimized: true,
    open: false,
    current: '',
    view: 'default',
    settings: {
      viewIndex: 0,
      views: ['permissions', 'verify', 'control'],
      subIndex: 0
    },
    addresses: [],
    showAccounts: false,
    accountPage: 0,
    position: {
      scrollTop: 0,
      initial: {
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        height: 5,
        index: 0
      }
    }
  },
  frame: {
    type: 'tray'
  },
  node: {
    provider: false
  },
  provider: {
    events: []
  },
  external: {
    rates: {}
  },
  platform: process.platform,
  main: {
    _version: main('_version', 18),
    colorway: main('colorway', 'dark'),
    colorwayPrimary: {
      dark: {
        background: '#1c1c1b',
        text: '#ecf1ff'
      },
      light: {
        background: '#cdcde5',
        text: '#1e3250'
      }
    },
    mute: {
      alphaWarning: main('mute.alphaWarning', false),
      welcomeWarning: main('mute.welcomeWarning', false),
      externalLinkWarning: main('mute.externalLinkWarning', false),
      explorerWarning: main('mute.explorerWarning', false),
      signerRelockChange: main('mute.signerRelockChange', false),
      gasFeeWarning: main('mute.gasFeeWarning', false),
      betaDisclosure: main('mute.betaDisclosure', false),
      signerCompatibilityWarning: main('mute.signerCompatibilityWarning', false)
    },
    shortcuts: {
      altSlash: main('shortcuts.altSlash', true)
    },
    // showUSDValue: main('showUSDValue', true),
    launch: main('launch', false),
    reveal: main('reveal', false),
    nonceAdjust: main('nonceAdjust', false),
    autohide: main('autohide', true),
    accountCloseLock: main('accountCloseLock', false),
    hardwareDerivation: main('hardwareDerivation', 'mainnet'),
    menubarGasPrice: main('menubarGasPrice', false),
    lattice: main('lattice', {}),
    latticeSettings: {
      accountLimit: main('latticeSettings.accountLimit', 5),
      derivation: main('latticeSettings.derivation', 'standard'),
      endpointMode: main('latticeSettings.endpointMode', 'default'),
      endpointCustom: main('latticeSettings.endpointCustom', '')
    },
    ledger: {
      derivation: main('ledger.derivation', 'live'),
      liveAccountLimit: main('ledger.liveAccountLimit', 5)
    },
    keystone: main('keystone', {}),
    trezor: {
      derivation: main('trezor.derivation', 'standard')
    },
    accounts: main('accounts', {}),
    addresses: main('addresses', {}), // Should be removed after 0.5 release
    permissions: main('permissions', {}),
    balances: [],
    tokens: main('tokens', { custom: [], known: {} }),
    rates: {}, // main('rates', {}),
    inventory: {}, // main('rates', {}),
    signers: {},
    savedSigners: {},
    updater: {
      dontRemind: main('updater.dontRemind', [])
    },
    clients: {
      ipfs: {
        on: false, // main('clients.ipfs.on', false),
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      },
      geth: {
        on: false, // main('clients.geth.on', false),
        blockNumber: 0,
        currentBlock: 0,
        highestBlock: 0,
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      },
      parity: {
        on: main('clients.parity.on', false),
        blockNumber: 0,
        currentBlock: 0,
        highestBlock: 0,
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      }
    },
    currentNetwork: main('currentNetwork', {
      type: 'ethereum',
      id: 1
    }),
    networkPresets: {
      ethereum: {
        default: {
          local: 'direct'
        },
        1: {
          alchemy: ['wss://eth-mainnet.ws.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0', 'https://eth-mainnet.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0'],
          infura: 'infura'
        },
        3: {
          infura: 'infuraRopsten'
        },
        4: {
          infura: 'infuraRinkeby'
        },
        5: {
          infura: ['wss://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b', 'https://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'],
          mudit: 'https://rpc.goerli.mudit.blog',
          slockit: 'https://rpc.slock.it/goerli',
          prylabs: 'https://goerli.prylabs.net'
        },
        10: {
          optimism: 'https://mainnet.optimism.io',
          infura: 'https://optimism-mainnet.infura.io/v3/786ade30f36244469480aa5c2bf0743b'
        },
        42: {
          infura: 'infuraKovan'
        },
        74: {
          idchain: 'wss://idchain.one/ws/'
        },
        100: {
          poa: 'https://dai.poa.network'
        },
        137: {
          infura: 'https://polygon-mainnet.infura.io/v3/786ade30f36244469480aa5c2bf0743b'
        },
        42161: {
          infura: 'https://arbitrum-mainnet.infura.io/v3/786ade30f36244469480aa5c2bf0743b'
        }
      }
    },
    networks: main('networks', { 
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
          layer: 'mainnet',
          symbol: 'ETH',
          name: 'Mainnet',
          explorer: 'https://etherscan.io',
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
          on: true
        },
        3: {
          id: 3,
          type: 'ethereum',
          layer: 'testnet',
          symbol: 'ETH',
          name: 'Ropsten',
          explorer: 'https://ropsten.etherscan.io',
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
        },
        4: {
          id: 4,
          type: 'ethereum',
          layer: 'testnet',
          symbol: 'ETH',
          name: 'Rinkeby',
          explorer: 'https://rinkeby.etherscan.io',
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
        },
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
        },
        10: {
          id: 10,
          type: 'ethereum',
          layer: 'rollup',
          symbol: 'ETH',
          name: 'Optimism',
          explorer: 'https://optimistic.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: { on: true, current: 'optimism', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          on: false
        },
        42: {
          id: 42,
          type: 'ethereum',
          layer: 'testnet',
          symbol: 'ETH',
          name: 'Kovan',
          explorer: 'https://kovan.etherscan.io',
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
        },
        // 74: {
        //   id: 74,
        //   type: 'ethereum',
        //   symbol: 'EIDI',
        //   name: 'IDChain',
        //   explorer: 'https://explorer.idchain.one',
        //   gas: {
        //     price: {
        //       selected: 'standard',
        //       levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        //     }
        //   },
        //   connection: {
        //     primary: { on: true, current: 'idchain', status: 'loading', connected: false, type: '', network: '', custom: '' },
        //     secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
        //   }
        // },
        100: {
          id: 100,
          type: 'ethereum',
          layer: 'sidechain',
          symbol: 'xDAI',
          name: 'xDai',
          explorer: 'https://blockscout.com/poa/xdai',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: { on: true, current: 'poa', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          on: false
        },
        137: {
          id: 137,
          type: 'ethereum',
          layer: 'sidechain',
          symbol: 'MATIC',
          name: 'Polygon',
          explorer: 'https://polygonscan.com',
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
        },
        42161: {
          id: 42161,
          type: 'ethereum',
          layer: 'rollup',
          symbol: 'ETH',
          name: 'Arbitrum',
          explorer: 'https://explorer.arbitrum.io',
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
    }),
    networksMeta: main('networksMeta', {
      ethereum: {
        1: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        3: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        4: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        5: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        10: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        42: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        100: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        137: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        42161: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        }
      }
    }),
    ipfs: {},
    dapps: {},
    frames: {},
    openDapps: [],
    dapp: {
      details: {},
      map: {
        added: [],
        docked: []
      },
      storage: {},
      removed: []
    }
  }
}

// Remove permissions granted to unknown origins
Object.keys(initial.main.accounts).forEach(id => {
  const permissions = initial.main.permissions[id]
  if (permissions) delete permissions[uuidv5('Unknown', uuidv5.DNS)]
})

module.exports = () => migrations.apply(initial)
