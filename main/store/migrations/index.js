import log from 'electron-log'
import { v5 as uuidv5 } from 'uuid'
import { accountNS, isDefaultAccountName } from '../../../resources/domain/account'

const migrations = {
  4: (initial) => {
    // If persisted state still has main.gasPrice, move gas settings into networks
    const gasPrice = initial.main.gasPrice // ('gasPrice', false)

    if (gasPrice) {
      Object.keys(gasPrice).forEach((network) => {
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
    const connection = initial.main.connection // main('connection', false)
    if (connection) {
      // Copy all local connection settings to new connection object
      if (connection.local && connection.local.settings) {
        Object.keys(connection.local.settings).forEach((id) => {
          if (
            connection.secondary.settings[id] &&
            initial.main.networks.ethereum[id] &&
            initial.main.networks.ethereum[id].connection
          ) {
            // Copy local custom endpoint to new connection object
            if (connection.local.settings[id].options)
              initial.main.networks.ethereum[id].connection.primary.custom =
                connection.local.settings[id].options.custom
            // Copy local current selection to new connection object
            let current = connection.local.settings[id].current
            if (current === 'direct') current = 'local'
            if (current) initial.main.networks.ethereum[id].connection.primary.current = current
          }
        })
      }
      // Copy all secondary connection settings to new connection object
      if (connection.secondary && connection.secondary.settings) {
        Object.keys(connection.secondary.settings).forEach((id) => {
          if (
            connection.secondary.settings[id] &&
            initial.main.networks.ethereum[id] &&
            initial.main.networks.ethereum[id].connection
          ) {
            // Copy all secondary connection settings to new connection object
            if (connection.secondary.settings[id].options)
              initial.main.networks.ethereum[id].connection.secondary.custom =
                connection.secondary.settings[id].options.custom
            // Copy local current selection to new connection object
            let current = connection.secondary.settings[id].current
            if (current === 'direct') current = 'local'
            if (current) initial.main.networks.ethereum[id].connection.secondary.current = current
          }
        })
      }
      // Copy primary/secondary on/off
      Object.keys(initial.main.networks.ethereum).forEach((id) => {
        initial.main.networks.ethereum[id].connection.primary.on = connection.local.on
        initial.main.networks.ethereum[id].connection.secondary.on = connection.secondary.on
      })
      initial.main.currentNetwork.id = connection.network || initial.main.currentNetwork.id || 1
    }

    Object.keys(initial.main.networks.ethereum).forEach((id) => {
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
      if (initial.main.networks.ethereum[id].gas.price.selected === 'safelow')
        initial.main.networks.ethereum[id].gas.price.selected = 'slow'
      if (initial.main.networks.ethereum[id].gas.price.selected === 'trader')
        initial.main.networks.ethereum[id].gas.price.selected = 'asap'
      if (initial.main.networks.ethereum[id].gas.price.selected === 'custom')
        initial.main.networks.ethereum[id].gas.price.selected =
          initial.main.networks.ethereum[id].gas.price.lastLevel || 'standard'
    })

    // If migrating from before this was a setting make it 'true' to grandfather behavior
    if (initial.main.mute && initial.main.accountCloseLock === undefined) initial.main.accountCloseLock = true

    return initial
  },
  5: (initial) => {
    // Add Polygon to persisted networks
    initial.main.networks.ethereum[137] = {
      id: 137,
      type: 'ethereum',
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
        primary: {
          on: true,
          current: 'matic',
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
      }
    }
    return initial
  },
  6: (initial) => {
    // If previous hardwareDerivation is testnet, set that for split ledger/trezor derevation
    if (initial.main.hardwareDerivation === 'testnet') {
      initial.main.ledger.derivation = 'testnet'
      initial.main.trezor.derivation = 'testnet'
    }
    return initial
  },
  7: (initial) => {
    // Move account to become cross chain accounts
    const moveOldAccountsToNewAddresses = () => {
      const addressesToMove = {}
      const accounts = JSON.parse(JSON.stringify(initial.main.accounts))
      Object.keys(accounts).forEach((id) => {
        if (id.startsWith('0x')) {
          addressesToMove[id] = accounts[id]
          delete accounts[id]
        }
      })
      initial.main.accounts = accounts
      Object.keys(addressesToMove).forEach((id) => {
        initial.main.addresses[id] = addressesToMove[id]
      })
    }

    // Before the v6 state migration
    // If users have very old state they will first need to do an older account migration
    moveOldAccountsToNewAddresses()

    // Once this is complete they can now do the current account migration
    const newAccounts = {}
    // const nameCount = {}
    let { accounts, addresses } = initial.main
    accounts = JSON.parse(JSON.stringify(accounts))
    addresses = JSON.parse(JSON.stringify(addresses))
    Object.keys(addresses).forEach((address) => {
      // Normalize address case
      addresses[address.toLowerCase()] = addresses[address]
      address = address.toLowerCase()

      const hasPermissions =
        addresses[address] &&
        addresses[address].permissions &&
        Object.keys(addresses[address].permissions).length > 0
      // const hasTokens = addresses[address] && addresses[address].tokens && Object.keys(addresses[address].tokens).length > 0
      if (!hasPermissions) return log.info(`Address ${address} did not have any permissions or tokens`)

      // Copy Account permissions
      initial.main.permissions[address] =
        addresses[address] && addresses[address].permissions
          ? Object.assign({}, addresses[address].permissions)
          : {}

      const matchingAccounts = []
      Object.keys(accounts)
        .sort((a, b) => (accounts[a].created > accounts[b].created ? 1 : -1))
        .forEach((id) => {
          if (
            accounts[id].addresses &&
            accounts[id].addresses.map &&
            accounts[id].addresses.map((a) => a.toLowerCase()).indexOf(address) > -1
          ) {
            matchingAccounts.push(id)
          }
        })
      if (matchingAccounts.length > 0) {
        const primaryAccount = matchingAccounts.sort((a, b) => {
          return accounts[a].addresses.length === accounts[b].addresses.length
            ? 0
            : accounts[a].addresses.length > accounts[b].addresses.length
            ? -1
            : 1
        })
        newAccounts[address] = Object.assign({}, accounts[primaryAccount[0]])
        // nameCount[newAccounts[address].name] = nameCount[newAccounts[address].name] || 0
        // nameCount[newAccounts[address].name]++
        // if (nameCount[newAccounts[address].name] > 1) newAccounts[address].name = newAccounts[address].name + ' ' + nameCount[newAccounts[address].name]
        newAccounts[address].address = address
        newAccounts[address].id = address
        newAccounts[address].lastSignerType = newAccounts[address].type
        delete newAccounts[address].type
        delete newAccounts[address].network
        delete newAccounts[address].signer
        delete newAccounts[address].index
        delete newAccounts[address].addresses
        newAccounts[address].tokens =
          addresses[address] && addresses[address].tokens ? addresses[address].tokens : {}
        newAccounts[address] = Object.assign({}, newAccounts[address])
      }
    })
    initial.main.backup = initial.main.backup || {}
    initial.main.backup.accounts = Object.assign({}, initial.main.accounts)
    initial.main.backup.addresses = Object.assign({}, initial.main.addresses)
    initial.main.accounts = newAccounts
    delete initial.main.addresses

    return initial
  },
  8: (initial) => {
    // Add on/off value to chains
    Object.keys(initial.main.networks.ethereum).forEach((chainId) => {
      initial.main.networks.ethereum[chainId].on =
        chainId === '1' || chainId === initial.main.currentNetwork.id ? true : false
    })

    return initial
  },
  9: (initial) => {
    Object.keys(initial.main.networks.ethereum).forEach((chainId) => {
      if (chainId === '1') {
        initial.main.networks.ethereum[chainId].layer = 'mainnet'
      } else if (chainId === '10') {
        initial.main.networks.ethereum[chainId].layer = 'rollup'
      } else if (chainId === '100' || chainId === '137') {
        initial.main.networks.ethereum[chainId].layer = 'sidechain'
      } else if (chainId === '3' || chainId === '4' || chainId === '5' || chainId === '42') {
        initial.main.networks.ethereum[chainId].layer = 'testnet'
      } else {
        initial.main.networks.ethereum[chainId].layer = 'other'
      }
    })

    return initial
  },
  10: (initial) => {
    // Add Optimism to persisted networks
    initial.main.networks.ethereum[10] = {
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
        primary: {
          on: true,
          current: 'optimism',
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
    return initial
  },
  11: (initial) => {
    // Convert all Ξ symbols to ETH
    Object.keys(initial.main.networks.ethereum).forEach((chain) => {
      if (initial.main.networks.ethereum[chain].symbol === 'Ξ') {
        initial.main.networks.ethereum[chain].symbol = 'ETH'
      }
    })
    // Convert all accounts to new creation type system
    Object.keys(initial.main.accounts).forEach((account) => {
      try {
        if (!initial.main.accounts[account].created || initial.main.accounts[account].created === -1) {
          initial.main.accounts[account].created = 'new:' + Date.now()
        } else {
          initial.main.accounts[account].created = initial.main.accounts[account].created + ''
          const [block, localTime] = initial.main.accounts[account].created.split(':')
          if (!block) {
            initial.main.accounts[account].created = 'new:' + Date.now()
          } else if (!localTime) {
            initial.main.accounts[account].created = block + ':' + Date.now()
          }
        }

        let [block, localTime] = initial.main.accounts[account].created.split(':')
        if (block.startsWith('0x')) block = parseInt(block, 'hex')
        if (block > 12726312) block = 12726312
        initial.main.accounts[account].created = block + ':' + localTime
      } catch (e) {
        log.error('Migration error', e)
        delete initial.main.accounts[account]
      }
    })

    return initial
  },
  12: (initial) => {
    // Update old smart accounts
    Object.keys(initial.main.accounts).forEach((id) => {
      if (initial.main.accounts[id].smart) {
        initial.main.accounts[id].smart.actor = initial.main.accounts[id].smart.actor.address
      }
    })

    return initial
  },
  13: (initial) => {
    const defaultMeta = {
      gas: {
        price: {
          selected: 'standard',
          levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        }
      }
    }

    // ensure all network configurations have corresponding network meta
    Object.keys(initial.main.networks.ethereum).forEach((networkId) => {
      if (initial.main.networksMeta.ethereum[networkId]) {
        const gasSettings = initial.main.networksMeta.ethereum[networkId].gas || { price: {} }

        initial.main.networksMeta.ethereum[networkId].gas = {
          price: {
            selected: gasSettings.price.selected || defaultMeta.gas.price.selected,
            levels: gasSettings.price.levels || defaultMeta.gas.price.levels
          }
        }
      } else {
        initial.main.networksMeta.ethereum[networkId] = { ...defaultMeta }
      }
    })

    return initial
  },
  14: (initial) => {
    if (initial.main.networks.ethereum[137] && initial.main.networks.ethereum[137].connection) {
      const { primary, secondary } = initial.main.networks.ethereum[137].connection || {}
      if (primary.current === 'matic') primary.current = 'infura'
      if (secondary.current === 'matic') secondary.current = 'infura'
    }

    // add arbitrum network information
    if (!initial.main.networks.ethereum[42161]) {
      initial.main.networks.ethereum[42161] = {
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

    if (!initial.main.networksMeta.ethereum[42161]) {
      initial.main.networksMeta.ethereum[42161] = {
        gas: {
          fees: {},
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        }
      }
    }

    return initial
  },
  15: (initial) => {
    // Polygon
    if (initial.main.networks.ethereum['137']) {
      const oldExplorer = initial.main.networks.ethereum['137'].explorer

      if (!oldExplorer || oldExplorer.endsWith('explorer.matic.network')) {
        // only replace if it hasn't been changed from the initial setting
        initial.main.networks.ethereum['137'].explorer = 'https://polygonscan.com'
      }
    }

    return initial
  },
  16: (initial) => {
    if (initial.main.currentNetwork?.id) {
      initial.main.currentNetwork.id = parseInt(initial.main.currentNetwork.id)
    }
    Object.keys(initial.main.networks.ethereum).forEach((chain) => {
      try {
        initial.main.networks.ethereum[chain].id = parseInt(initial.main.networks.ethereum[chain].id)
      } catch (e) {
        log.error(e)
      }
    })
    return initial
  },
  17: (initial) => {
    // update Lattice settings
    const lattices = initial.main.lattice || {}
    const oldSuffix = initial.main.latticeSettings?.suffix || ''

    Object.values(lattices).forEach((lattice) => {
      lattice.paired = true
      lattice.tag = oldSuffix
      lattice.deviceName = 'GridPlus'
    })

    return initial
  },
  18: (initial) => {
    // move custom tokens to new location
    let existingCustomTokens = []

    if (Array.isArray(initial.main.tokens)) {
      existingCustomTokens = [...initial.main.tokens]
    }

    initial.main.tokens = { custom: existingCustomTokens }

    return initial
  },
  19: (initial) => {
    // delete main.currentNetwork and main.clients
    delete initial.main.currentNetwork
    delete initial.main.clients

    return initial
  },
  20: (initial) => {
    // move all Aragon accounts to mainnet and add a warning if we did
    Object.values(initial.main.accounts).forEach((account) => {
      if (account.smart?.type === 'aragon' && !account.smart.chain) {
        account.smart.chain = { type: 'ethereum', id: 1 }
        initial.main.mute.aragonAccountMigrationWarning = false
      }
    })

    return initial
  },
  21: (initial) => {
    // add sepolia network information
    if (!initial.main.networks.ethereum[11155111]) {
      initial.main.networks.ethereum[11155111] = {
        id: 11155111,
        type: 'ethereum',
        layer: 'testnet',
        symbol: 'ETH',
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

    if (!initial.main.networksMeta.ethereum[11155111]) {
      initial.main.networksMeta.ethereum[11155111] = {
        gas: {
          fees: {},
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        }
      }
    }

    // we removed support for the following goerli RPCs so reset the connections
    // to defaults when the user was previously connecting to them
    const removedGoerliRPCs = ['mudit', 'slockit', 'prylabs']
    const goerli = initial.main.networks.ethereum[5]
    const goerliPrimaryConnection = goerli.connection.primary.current
    const goerliSecondaryConnection = goerli.connection.secondary.current

    if (removedGoerliRPCs.includes(goerliPrimaryConnection)) {
      initial.main.networks.ethereum[5] = {
        ...goerli,
        connection: {
          ...goerli.connection,
          primary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      }
    }
    if (removedGoerliRPCs.includes(goerliSecondaryConnection)) {
      initial.main.networks.ethereum[5] = {
        ...goerli,
        connection: {
          ...goerli.connection,
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      }
    }

    // if neither primary nor secondary is enabled then we switch the overall connection off
    initial.main.networks.ethereum[5].connection.on =
      goerli.connection.primary.on || goerli.connection.secondary.on

    return initial
  },
  22: (initial) => {
    // set "isTestnet" flag on all chains based on layer value
    Object.values(initial.main.networks.ethereum).forEach((chain) => {
      chain.isTestnet = chain.layer === 'testnet'
    })

    return initial
  },
  23: (initial) => {
    // set icon and primaryColor values on all chains
    Object.entries(initial.main.networksMeta.ethereum).forEach(([id, chain]) => {
      if (id === '1') {
        chain.icon = ''
        chain.primaryColor = 'accent1' // Main
      } else if (id === '10') {
        chain.icon = 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/optimism.svg'
        chain.primaryColor = 'accent4' // Optimism
      } else if (id === '100') {
        chain.icon = 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/gnosis.svg'
        chain.primaryColor = 'accent5' // Gnosis
      } else if (id === '137') {
        chain.icon = 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/polygon.svg'
        chain.primaryColor = 'accent6' // Polygon
      } else if (id === '42161') {
        chain.icon = 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg'
        chain.primaryColor = 'accent7' // Arbitrum
      } else if (['3', '4', '5', '42', '11155111'].includes(id)) {
        chain.icon = ''
        chain.primaryColor = 'accent2' // Testnets
      } else {
        chain.icon = ''
        chain.primaryColor = 'accent3' // Default
      }
    })

    return initial
  },
  24: (initial) => {
    // set default nativeCurrency where it doesn't exist
    Object.values(initial.main.networksMeta.ethereum).forEach((chain) => {
      if (!chain.nativeCurrency) {
        chain.nativeCurrency = {
          usd: { price: 0, change24hr: 0 },
          icon: '',
          name: '',
          symbol: '',
          decimals: 0
        }
      }
    })

    return initial
  },
  25: (initial) => {
    const optimism = initial.main.networks.ethereum[10]
    const removeOptimismConnection = (connection) => ({
      ...connection,
      current: connection.current === 'optimism' ? 'infura' : connection.current
    })

    initial.main.networks.ethereum[10] = {
      ...optimism,
      connection: {
        primary: removeOptimismConnection(optimism.connection.primary),
        secondary: removeOptimismConnection(optimism.connection.secondary)
      }
    }
    return initial
  },
  26: (initial) => {
    Object.values(initial.main.networks.ethereum).forEach((network) => {
      const { symbol, id } = network
      initial.main.networksMeta.ethereum[id].nativeCurrency.symbol =
        initial.main.networksMeta.ethereum[id].nativeCurrency.symbol || symbol
      delete network.symbol
    })

    return initial
  },
  27: (initial) => {
    // change any accounts with the old names of "seed signer" or "ring signer" to "hot signer"

    const accounts = Object.entries(initial.main.accounts).map(([id, account]) => {
      const name = ['ring account', 'seed account'].includes((account.name || '').toLowerCase())
        ? 'Hot Account'
        : account.name

      return [id, { ...account, name }]
    })

    initial.main.accounts = Object.fromEntries(accounts)

    return initial
  },
  28: (initial) => {
    const networkMeta = initial.main.networksMeta.ethereum
    const {
      5: {
        nativeCurrency: { symbol: goerliSymbol }
      },
      11155111: {
        nativeCurrency: { symbol: sepoliaSymbol }
      }
    } = networkMeta
    goerliSymbol === 'ETH' && (initial.main.networksMeta.ethereum[5].nativeCurrency.symbol = 'görETH')
    sepoliaSymbol === 'ETH' && (initial.main.networksMeta.ethereum[11155111].nativeCurrency.symbol = 'sepETH')
    Object.values(initial.main.networksMeta.ethereum).forEach((metadata) => {
      metadata.nativeCurrency.decimals = metadata.nativeCurrency.decimals || 18
    })
    return initial
  },
  29: (initial) => {
    // add accountsMeta
    initial.main.accountsMeta = {}
    Object.entries(initial.main.accounts).forEach(([id, account]) => {
      if (!isDefaultAccountName(account)) {
        const accountMetaId = uuidv5(id, accountNS)
        initial.main.accountsMeta[accountMetaId] = {
          name: account.name,
          lastUpdated: Date.now()
        }
      }
    })

    return initial
  },
  30: (initial) => {
    // convert Aragon accounts to watch only
    Object.entries(initial.main.accounts).forEach(([id, { smart, name }]) => {
      if (smart) {
        initial.main.accounts[id] = {
          id,
          name,
          lastSignerType: 'address',
          address: id,
          status: 'ok',
          active: false,
          signer: '',
          requests: {},
          ensName: '',
          created: `new:${Date.now()}`,
          balances: {}
        }
      }
    })

    return initial
  }
}

// Version number of latest known migration
const latest = Math.max(...Object.keys(migrations))

module.exports = {
  // Apply migrations to current state
  apply: (state, migrateToVersion = latest) => {
    state.main._version = state.main._version || 0
    Object.keys(migrations)
      .sort((a, b) => a - b)
      .forEach((version) => {
        if (parseInt(state.main._version) < version && version <= migrateToVersion) {
          log.info(`Applying state migration: ${version}`)
          state = migrations[version](state)
          state.main._version = version
        }
      })

    return state
  },
  latest
}
