const { v4: generateUuid, v5: uuidv5 } = require('uuid')

const persist = require('../persist')
const migrations = require('../migrations')

const latestStateVersion = () => {
  const state = persist.get('main')
  if (!state || !state.__) {
    // log.info('Persisted state: returning base state')
    return state
  }

  // valid states are less than or equal to the latest migration we know about
  const versions = Object.keys(state.__)
    .filter((v) => v <= migrations.latest)
    .sort((a, b) => a - b)

  if (versions.length === 0) {
    // log.info('Persisted state: returning base state')
    return state
  }

  const latest = versions[versions.length - 1]
  // log.info('Persisted state: returning latest state version: ', latest)
  return state.__[latest].main
}

const get = (path, obj = latestStateVersion()) => {
  path.split('.').some((key) => {
    if (typeof obj !== 'object') {
      obj = undefined
    } else {
      obj = obj[key]
    }
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
  windows: {
    panel: {
      show: false,
      nav: [],
      footer: {
        height: 40
      }
    },
    dash: {
      show: false,
      nav: [],
      footer: {
        height: 40
      }
    },
    frames: []
  },
  panel: {
    // Panel view
    showing: false,
    nav: [],
    show: false,
    view: 'default',
    viewData: '',
    account: {
      moduleOrder: [
        'requests',
        // 'activity',
        // 'gas',
        'chains',
        'balances',
        'inventory',
        'permissions',
        // 'verify',
        'signer',
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
        gas: {
          height: 100
        }
      }
    }
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
    _version: main('_version', 36),
    instanceId: main('instanceId', generateUuid()),
    colorway: main('colorway', 'dark'),
    colorwayPrimary: {
      dark: {
        background: 'rgb(26, 22, 28)',
        text: 'rgb(241, 241, 255)'
      },
      light: {
        background: 'rgb(240, 230, 243)',
        text: 'rgb(20, 40, 60)'
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
      onboardingWindow: main('mute.onboardingWindow', false),
      signerCompatibilityWarning: main('mute.signerCompatibilityWarning', false)
    },
    shortcuts: {
      summon: main('shortcuts.summon', {
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      })
    },
    // showUSDValue: main('showUSDValue', true),
    launch: main('launch', false),
    reveal: main('reveal', false),
    showLocalNameWithENS: main('showLocalNameWithENS', false),
    autohide: main('autohide', false),
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
    trezor: {
      derivation: main('trezor.derivation', 'standard')
    },
    origins: main('origins', {}),
    knownExtensions: main('knownExtensions', {}),
    privacy: {
      errorReporting: main('privacy.errorReporting', true)
    },
    accounts: main('accounts', {}),
    accountsMeta: main('accountsMeta', {}),
    addresses: main('addresses', {}), // Should be removed after 0.5 release
    permissions: main('permissions', {}),
    balances: {},
    tokens: main('tokens', { custom: [], known: {} }),
    rates: {}, // main('rates', {}),
    inventory: {}, // main('rates', {}),
    signers: {},
    savedSigners: {},
    updater: {
      dontRemind: main('updater.dontRemind', [])
    },
    networkPresets: {
      ethereum: {
        default: {
          local: 'direct'
        },
        1: {
          pylon: 'wss://evm.pylon.link/mainnet'
        },
        5: {
          pylon: 'wss://evm.pylon.link/goerli'
        },
        10: {
          pylon: 'wss://evm.pylon.link/optimism'
        },
        137: {
          pylon: 'wss://evm.pylon.link/polygon'
        },
        42161: {
          pylon: 'wss://evm.pylon.link/arbitrum'
        },
        11155111: {
          pylon: 'wss://evm.pylon.link/sepolia'
        }
      }
    },
    networks: main('networks', {
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
          layer: 'mainnet',
          name: 'Mainnet',
          isTestnet: false,
          explorer: 'https://etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'pylon',
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
          on: true
        },
        5: {
          id: 5,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
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
              current: 'pylon',
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
        },
        10: {
          id: 10,
          type: 'ethereum',
          layer: 'rollup',
          isTestnet: false,
          name: 'Optimism',
          explorer: 'https://optimistic.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'pylon',
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
        },
        100: {
          id: 100,
          type: 'ethereum',
          layer: 'sidechain',
          isTestnet: false,
          name: 'Gnosis',
          explorer: 'https://blockscout.com/xdai/mainnet',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: 'https://rpc.gnosischain.com'
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
        },
        137: {
          id: 137,
          type: 'ethereum',
          layer: 'sidechain',
          isTestnet: false,
          name: 'Polygon',
          explorer: 'https://polygonscan.com',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'pylon',
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
        },
        42161: {
          id: 42161,
          type: 'ethereum',
          layer: 'rollup',
          isTestnet: false,
          name: 'Arbitrum',
          explorer: 'https://arbiscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'pylon',
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
        },
        84531: {
          id: 84531,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
          name: 'Base Görli',
          explorer: 'https://goerli-explorer.base.org',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'custom',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: 'https://goerli.base.org'
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
        },
        11155111: {
          id: 11155111,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
          name: 'Sepolia',
          explorer: 'https://sepolia.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: {
              on: true,
              current: 'pylon',
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
    }),
    networksMeta: main('networksMeta', {
      ethereum: {
        1: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'ETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
            name: 'Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent1' // Mainnet
        },
        5: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'görETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Görli Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2' // Testnet
        },
        10: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/optimism.svg',
          primaryColor: 'accent4' // Optimism
        },
        100: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'xDAI',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'xDAI',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/gnosis.svg',
          primaryColor: 'accent5' // Gnosis
        },
        137: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'MATIC',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Matic',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/polygon.svg',
          primaryColor: 'accent6' // Polygon
        },
        42161: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg',
          primaryColor: 'accent7' // Arbitrum
        },
        84531: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'görETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Görli Ether',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
          primaryColor: 'accent2' // Testnet
        },
        11155111: {
          blockHeight: 0,
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          nativeCurrency: {
            symbol: 'sepETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Sepolia Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2' // Testnet
        }
      }
    }),
    dapps: main('dapps', {}),
    ipfs: {},
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

// --- remove state that should not persist from session to session

Object.keys(initial.main.accounts).forEach((id) => {
  // Remove permissions granted to unknown origins
  const permissions = initial.main.permissions[id]
  if (permissions) delete permissions[uuidv5('Unknown', uuidv5.DNS)]

  // remote lastUpdated timestamp from balances
  initial.main.accounts[id].balances = { lastUpdated: undefined }
})

Object.values(initial.main.networks.ethereum).forEach((chain) => {
  chain.connection.primary = { ...chain.connection.primary, connected: false }
  chain.connection.secondary = { ...chain.connection.secondary, connected: false }
})

Object.values(initial.main.networksMeta).forEach((chains) => {
  Object.values(chains).forEach((chainMeta) => {
    // remove stale price data
    chainMeta.nativeCurrency = { ...chainMeta.nativeCurrency, usd: { price: 0, change24hr: 0 } }
  })
})

initial.main.origins = Object.entries(initial.main.origins).reduce((origins, [id, origin]) => {
  if (id !== uuidv5('Unknown', uuidv5.DNS)) {
    // don't persist unknown origin
    origins[id] = {
      ...origin,
      session: {
        ...origin.session,
        endedAt: origin.session.lastUpdatedAt
      }
    }
  }

  return origins
}, {})

initial.main.knownExtensions = Object.fromEntries(
  Object.entries(initial.main.knownExtensions).filter(([_id, allowed]) => allowed)
)

initial.main.dapps = Object.fromEntries(
  Object.entries(initial.main.dapps).map(([id, dapp]) => [id, { ...dapp, openWhenReady: false }])
)

// ---

module.exports = () => migrations.apply(initial)
