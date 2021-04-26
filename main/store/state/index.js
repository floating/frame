const { v5: uuidv5 } = require('uuid')

const log = require('electron-log')

const persist = require('../persist')

const get = (path, obj = persist.get('main')) => {
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
        'gas',
        'balances',
        'inventory',
        'activity',
        'permissions',
        'verify'
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
    type: 'signers'
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
    _version: main('_version', 0),
    colorway: main('colorway', 'dark'),
    mute: {
      alphaWarning: main('mute.alphaWarning', false),
      welcomeWarning: main('mute.welcomeWarning', false),
      externalLinkWarning: main('mute.externalLinkWarning', false),
      explorerWarning: main('mute.explorerWarning', false),
      signerRelockChange: main('mute.signerRelockChange', false),
      gasFeeWarning: main('mute.gasFeeWarning', false)
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
    ledger: {
      derivation: main('ledger.derivation', 'legacy'),
      liveAccountLimit: main('ledger.liveAccountLimit', 5)
    },
    accounts: main('accounts', {}),
    addresses: main('addresses', {}), // New persisted address permissions
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
      id: '1'
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
          prylabs: 'https://goerli.prylabs.net',
          mudit: 'https://rpc.goerli.mudit.blog',
          slockit: 'https://rpc.slock.it/goerli',
          infura: ['wss://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b', 'https://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b']
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
          matic: 'https://rpc-mainnet.maticvigil.com'
        }
      }
    },
    networks: main('networks', {
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
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
          }
        },
        3: {
          id: 3,
          type: 'ethereum',
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
          }
        },
        4: {
          id: 4,
          type: 'ethereum',
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
          }
        },
        5: {
          id: 5,
          type: 'ethereum',
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
            primary: { on: true, current: 'prylabs', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
        },
        42: {
          id: 42,
          type: 'ethereum',
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
          }
        },
        74: {
          id: 74,
          type: 'ethereum',
          symbol: 'EIDI',
          name: 'IDChain',
          explorer: 'https://explorer.idchain.one',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: { on: true, current: 'idchain', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
        },
        100: {
          id: 100,
          type: 'ethereum',
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
          }
        }
      }
    }),
    ipfs: {},
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

// New perist pattern, persist these paths
// const syncPaths = [
//   'main.networks'
// ]

// Remove permissions granted to unknown origins
Object.keys(initial.main.accounts).forEach(id => {
  const account = initial.main.accounts[id]
  if (account && account.permissions) {
    delete account.permissions[uuidv5('Unknown', uuidv5.DNS)]
  }
})

// If persisted state still has main.gasPrice, move gas settings into networks
const gasPrice = main('gasPrice', false)

if (gasPrice) {
  Object.keys(gasPrice).forEach(network => {
    // Prerelease versions of 0.3.2 used 'normal' instead of 'standard'
    if (gasPrice[network].default === 'normal') gasPrice[network].default = 'standard'
    // For each network with gasPrices, copy over default and custom level
    if (initial.main.networks.ethereum[network] && initial.main.networks.ethereum[network].gas) {
      initial.main.networks.ethereum[network].gas.price.selected = gasPrice[network].default
      initial.main.networks.ethereum[network].gas.price.levels.custom = gasPrice[network].levels.custom
    }
  })
}

// If persisted state state still has main.connection, move connection settings into networks
const connection = main('connection', false)
if (connection) {
  // Copy all local connection settings to new connection object
  if (connection.local && connection.local.settings) {
    Object.keys(connection.local.settings).forEach(id => {
      if (connection.secondary.settings[id] && initial.main.networks.ethereum[id] && initial.main.networks.ethereum[id].connection) {
        // Copy local custom endpoint to new connection object
        if (connection.local.settings[id].options) initial.main.networks.ethereum[id].connection.primary.custom = connection.local.settings[id].options.custom
        // Copy local current selection to new connection object
        let current = connection.local.settings[id].current
        if (current === 'direct') current = 'local'
        if (current) initial.main.networks.ethereum[id].connection.primary.current = current
      }
    })
  }
  // Copy all secondary connection settings to new connection object
  if (connection.secondary && connection.secondary.settings) {
    Object.keys(connection.secondary.settings).forEach(id => {
      if (connection.secondary.settings[id] && initial.main.networks.ethereum[id] && initial.main.networks.ethereum[id].connection) {
        // Copy all secondary connection settings to new connection object
        if (connection.secondary.settings[id].options) initial.main.networks.ethereum[id].connection.secondary.custom = connection.secondary.settings[id].options.custom
        // Copy local current selection to new connection object
        let current = connection.secondary.settings[id].current
        if (current === 'direct') current = 'local'
        if (current) initial.main.networks.ethereum[id].connection.secondary.current = current
      }
    })
  }
  // Copy primary/secondary on/off
  Object.keys(initial.main.networks.ethereum).forEach(id => {
    initial.main.networks.ethereum[id].connection.primary.on = connection.local.on
    initial.main.networks.ethereum[id].connection.secondary.on = connection.secondary.on
  })
  initial.main.currentNetwork.id = connection.network + '' || initial.main.currentNetwork.id || '1'
}

Object.keys(initial.main.networks.ethereum).forEach(id => {
  // Earlier versions of v0.3.3 did not include symbols
  if (!initial.main.networks.ethereum[id].symbol) {
    if (id === 74) {
      initial.main.networks.ethereum[id].symbol = 'EIDI'
    } else if (id === 100) {
      initial.main.networks.ethereum[id].symbol = 'xDAI'
    } else {
      initial.main.networks.ethereum[id].symbol = 'ETH'
    }
  }
  if (initial.main.networks.ethereum[id].symbol === 'Ξ') initial.main.networks.ethereum[id].symbol = 'ETH'
  // Update safelow -> slow and trader -> asap
  if (initial.main.networks.ethereum[id].gas.price.selected === 'safelow') initial.main.networks.ethereum[id].gas.price.selected = 'slow'
  if (initial.main.networks.ethereum[id].gas.price.selected === 'trader') initial.main.networks.ethereum[id].gas.price.selected = 'asap'
  if (initial.main.networks.ethereum[id].gas.price.selected === 'custom') initial.main.networks.ethereum[id].gas.price.selected = initial.main.networks.ethereum[id].gas.price.lastLevel || 'standard'
})

// If migrating from before this was a setting make it 'true' to grandfather behavior
if (main('mute', false) && get('accountCloseLock') === undefined) initial.main.accountCloseLock = true

// State transition -> 4
if (initial.main._version < 4) {
  // Do state transition
  initial.main._version = 4
}

// State transition -> 5
if (initial.main._version < 5) {
  // Do state transition
  initial.main.networks.ethereum[137] = {
    id: 137,
    type: 'ethereum',
    symbol: 'MATIC',
    name: 'Polygon',
    explorer: 'https://explorer.matic.network',
    gas: {
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    connection: {
      primary: { on: true, current: 'matic', status: 'loading', connected: false, type: '', network: '', custom: '' },
      secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
    }
  }

  initial.main._version = 5
}


const moveOldAccountsToNewAddresses = () => {
  const addressesToMove = {}
  const accounts = JSON.parse(JSON.stringify(initial.main.accounts))
  Object.keys(accounts).forEach(id => {
    if (id.startsWith('0x')) {
      addressesToMove[id] = accounts[id]
      delete accounts[id]
    }
  })
  initial.main.accounts = accounts
  Object.keys(addressesToMove).forEach(id => {
    initial.main.addresses[id] = addressesToMove[id]
  })
}

// State transition -> 6
if (initial.main._version < 6) {

  // Before the v6 state migration
  // If users have very old state they will first need to do an older account migration
  moveOldAccountsToNewAddresses()

  // Once this is complete they can now do the current account migration

  const newAccounts = {}
  const nameCount = {}
  let { accounts, addresses } = initial.main
  accounts = JSON.parse(JSON.stringify(accounts))
  addresses = JSON.parse(JSON.stringify(addresses))
  Object.keys(addresses).forEach(address => {
    const hasPermissions = addresses[address] && addresses[address].permissions && Object.keys(addresses[address].permissions).length > 0
    const hasTokens = addresses[address] && addresses[address].tokens && Object.keys(addresses[address].tokens).length > 0
    if (!hasPermissions && !hasTokens) return log.info(`Address ${address} did not have any permissions or tokens`)
    address = address.toLowerCase()
    const matchingAccounts = []
    Object.keys(accounts).forEach(id => {
      if (accounts[id].addresses && accounts[id].addresses.map && accounts[id].addresses.map(a => a.toLowerCase()).indexOf(address) > -1) {
        matchingAccounts.push(id)
      }
    })
    if (matchingAccounts.length > 0) {
      const primaryAccount = matchingAccounts.sort((a, b) => {
        return accounts[a].addresses.length === accounts[b].addresses.length ? 0 : accounts[a].addresses.length > accounts[b].addresses.length ? -1 : 1
      })
      newAccounts[address] = Object.assign({}, accounts[primaryAccount[0]])
      nameCount[newAccounts[address].name] = nameCount[newAccounts[address].name] || 0
      const count = nameCount[newAccounts[address].name]
      if (count > 0) newAccounts[address].name = newAccounts[address].name + ' ' + (count + 1)
      nameCount[newAccounts[address].name]++
      newAccounts[address].address = address
      newAccounts[address].id = address
      newAccounts[address].lastSignerType = newAccounts[address].type
      delete newAccounts[address].type
      delete newAccounts[address].network
      delete newAccounts[address].signer
      delete newAccounts[address].index
      delete newAccounts[address].addresses
      newAccounts[address] = Object.assign({}, newAccounts[address], { tokens: {}, permissions: {} }, addresses[address])
    }

  })
  initial.main.accounts = newAccounts
  delete initial.main.addresses

  // Set state version so they never do this migration again
  initial.main._version = 6
}

module.exports = () => initial
