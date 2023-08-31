// legacy migrations that were written in JS and have not been ported
// to Typescript

import log from 'electron-log'
import { v5 as uuidv5 } from 'uuid'
import { z } from 'zod'

import { accountNS, isDefaultAccountName } from '../../../../../resources/domain/account'
import { isWindows } from '../../../../../resources/platform'

type LegacyMigration = (initial: unknown) => unknown

const migrations: Record<number, LegacyMigration> = {
  4: (initial: any) => {
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
      const chainId = parseInt(id)
      // Earlier versions of v0.3.3 did not include symbols
      if (!initial.main.networks.ethereum[id].symbol) {
        if (chainId === 74) {
          initial.main.networks.ethereum[id].symbol = 'EIDI'
        } else if (chainId === 100) {
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
  5: (initial: any) => {
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
  6: (initial: any) => {
    // If previous hardwareDerivation is testnet, set that for split ledger/trezor derevation
    if (initial.main.hardwareDerivation === 'testnet') {
      initial.main.ledger.derivation = 'testnet'
      initial.main.trezor.derivation = 'testnet'
    }
    return initial
  },
  7: (initial: any) => {
    // Move account to become cross chain accounts
    const moveOldAccountsToNewAddresses = () => {
      const addressesToMove: Record<string, string> = {}
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
    const newAccounts: Record<string, any> = {}
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

      const matchingAccounts: string[] = []
      Object.keys(accounts)
        .sort((a, b) => (accounts[a].created > accounts[b].created ? 1 : -1))
        .forEach((id) => {
          if (
            accounts[id].addresses &&
            accounts[id].addresses.map &&
            accounts[id].addresses.map((a: string) => a.toLowerCase()).indexOf(address) > -1
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
  8: (initial: any) => {
    // Add on/off value to chains
    Object.keys(initial.main.networks.ethereum).forEach((chainId) => {
      initial.main.networks.ethereum[chainId].on =
        chainId === '1' || chainId === initial.main.currentNetwork?.id
    })

    return initial
  },
  9: (initial: any) => {
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
  10: (initial: any) => {
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
  11: (initial: any) => {
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
        if (block.startsWith('0x')) block = parseInt(block, 16)
        if (block > 12726312) block = 12726312
        initial.main.accounts[account].created = block + ':' + localTime
      } catch (e) {
        log.error('Migration error', e)
        delete initial.main.accounts[account]
      }
    })

    return initial
  },
  12: (initial: any) => {
    // Update old smart accounts
    Object.keys(initial.main.accounts).forEach((id) => {
      if (initial.main.accounts[id].smart) {
        initial.main.accounts[id].smart.actor = initial.main.accounts[id].smart.actor.address
      }
    })

    return initial
  },
  13: (initial: any) => {
    const defaultMeta = {
      gas: {
        price: {
          selected: 'standard',
          levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        }
      }
    }

    initial.main.networksMeta = initial.main.networksMeta || { ethereum: {} }

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
  14: (initial: any) => {
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
  15: (initial: any) => {
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
  16: (initial: any) => {
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
  17: (initial: any) => {
    // update Lattice settings
    const lattices = initial.main.lattice || {}
    const oldSuffix = initial.main.latticeSettings?.suffix || ''

    Object.values(lattices).forEach((lattice: any) => {
      lattice.paired = true
      lattice.tag = oldSuffix
      lattice.deviceName = 'GridPlus'
    })

    return initial
  },
  18: (initial: any) => {
    // move custom tokens to new location
    let existingCustomTokens: any[] = []

    if (Array.isArray(initial.main.tokens)) {
      existingCustomTokens = [...initial.main.tokens]
    }

    initial.main.tokens = { custom: existingCustomTokens }

    return initial
  },
  19: (initial: any) => {
    // delete main.currentNetwork and main.clients
    delete initial.main.currentNetwork
    delete initial.main.clients

    return initial
  },
  20: (initial: any) => {
    // move all Aragon accounts to mainnet and add a warning if we did
    Object.values(initial.main.accounts).forEach((account: any) => {
      if (account.smart?.type === 'aragon' && !account.smart.chain) {
        account.smart.chain = { type: 'ethereum', id: 1 }
        initial.main.mute.aragonAccountMigrationWarning = false
      }
    })

    return initial
  },
  21: (initial: any) => {
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

    if ('5' in initial.main.networks.ethereum) {
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
    }

    return initial
  },
  22: (initial: any) => {
    // set "isTestnet" flag on all chains based on layer value
    Object.values(initial.main.networks.ethereum).forEach((chain: any) => {
      chain.isTestnet = chain.layer === 'testnet'
    })

    return initial
  },
  23: (initial: any) => {
    // set icon and primaryColor values on all chains
    Object.entries(initial.main.networksMeta.ethereum as Record<string, any>).forEach(([id, chain]) => {
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
  24: (initial: any) => {
    // set default nativeCurrency where it doesn't exist
    Object.values(initial.main.networksMeta.ethereum).forEach((chain: any) => {
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
  25: (initial: any) => {
    // remove Optimism RPC connection presets and use Infura instead
    if ('10' in initial.main.networks.ethereum) {
      const removeOptimismConnection = (connection: any) => ({
        ...connection,
        current: connection.current === 'optimism' ? 'infura' : connection.current
      })

      const optimism = initial.main.networks.ethereum[10]

      initial.main.networks.ethereum[10] = {
        ...optimism,
        connection: {
          primary: removeOptimismConnection(optimism.connection.primary),
          secondary: removeOptimismConnection(optimism.connection.secondary)
        }
      }
    }

    return initial
  },
  26: (initial: any) => {
    Object.values(initial.main.networks.ethereum).forEach((network: any) => {
      const { symbol, id } = network
      initial.main.networksMeta.ethereum[id].nativeCurrency.symbol =
        initial.main.networksMeta.ethereum[id].nativeCurrency.symbol || symbol
      delete network.symbol
    })

    return initial
  },
  27: (initial: any) => {
    // change any accounts with the old names of "seed signer" or "ring signer" to "hot signer"

    const accounts = Object.entries(initial.main.accounts as Record<string, any>).map(([id, account]) => {
      const name = ['ring account', 'seed account'].includes((account.name || '').toLowerCase())
        ? 'Hot Account'
        : account.name

      return [id, { ...account, name }]
    })

    initial.main.accounts = Object.fromEntries(accounts)

    return initial
  },
  28: (initial: any) => {
    const getUpdatedSymbol = (symbol: string, chainId: string) => {
      return parseInt(chainId) === 5 ? 'görETH' : parseInt(chainId) === 11155111 ? 'sepETH' : symbol
    }

    const updatedMeta = Object.entries(initial.main.networksMeta.ethereum as Record<string, any>).map(
      ([id, chainMeta]) => {
        const { symbol, decimals } = chainMeta.nativeCurrency
        const updatedSymbol = (symbol || '').toLowerCase() !== 'eth' ? symbol : getUpdatedSymbol(symbol, id)

        const updatedChainMeta = {
          ...chainMeta,
          nativeCurrency: {
            ...chainMeta.nativeCurrency,
            symbol: updatedSymbol,
            decimals: decimals || 18
          }
        }

        return [id, updatedChainMeta]
      }
    )

    initial.main.networksMeta.ethereum = Object.fromEntries(updatedMeta)

    return initial
  },
  29: (initial: any) => {
    // add accountsMeta
    initial.main.accountsMeta = {}
    Object.entries(initial.main.accounts as Record<string, any>).forEach(([id, account]) => {
      // Watch accounts, having a signer type of "address", used to have a default label of "Address Account"
      const isPreviousDefaultWatchAccountName =
        account.lastSignerType.toLowerCase() === 'address' && account.name.toLowerCase() === 'address account'
      if (!isPreviousDefaultWatchAccountName && !isDefaultAccountName(account)) {
        const accountMetaId = uuidv5(id, accountNS)
        initial.main.accountsMeta[accountMetaId] = {
          name: account.name,
          lastUpdated: Date.now()
        }
      }
    })

    return initial
  },
  30: (initial: any) => {
    // convert Aragon accounts to watch only
    Object.entries(initial.main.accounts as Record<string, any>).forEach(([id, { smart, name, created }]) => {
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
          created,
          balances: {}
        }
      }
    })

    return initial
  },
  31: (initial: any) => {
    const dodgyAddress = '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000'

    initial.main.balances = initial.main.balances || {}

    Object.entries(initial.main.balances as Record<string, any[]>).forEach(([address, balances]) => {
      initial.main.balances[address] = balances.filter(({ address }) => address !== dodgyAddress)
    })

    return initial
  },
  32: (initial: any) => {
    const dodgyAddress = '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000'
    const knownTokens = initial.main.tokens.known || {}
    Object.entries(knownTokens as Record<string, any[]>).forEach(([address, tokens]) => {
      knownTokens[address] = tokens.filter(({ address }) => address !== dodgyAddress)
    })

    initial.main.tokens.known = knownTokens

    return initial
  },
  33: (initial: any) => {
    // add Base testnet network information
    if (!initial.main.networks.ethereum[84531]) {
      initial.main.networks.ethereum[84531] = {
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
      }
    }

    if (!initial.main.networksMeta.ethereum[84531]) {
      initial.main.networksMeta.ethereum[84531] = {
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
      }
    }

    return initial
  },
  34: (initial: any) => {
    // Add any missing nativeCurrency name values
    // Base Görli (84531) value added in #33
    const nativeCurrencyMap: Record<number, any> = {
      1: {
        name: 'Ether',
        symbol: 'ETH'
      },
      5: {
        name: 'Görli Ether',
        symbol: 'görETH'
      },
      10: {
        name: 'Ether',
        symbol: 'ETH'
      },
      100: {
        name: 'xDAI',
        symbol: 'xDAI'
      },
      137: {
        name: 'Matic',
        symbol: 'MATIC'
      },
      42161: {
        name: 'Ether',
        symbol: 'ETH'
      },
      11155111: {
        name: 'Sepolia Ether',
        symbol: 'sepETH'
      }
    }

    Object.values(initial.main.networks.ethereum as Record<string, any>).forEach((network) => {
      const { id } = network
      const { name = '', symbol = '' } = nativeCurrencyMap[id] || {}
      const existingMeta = initial.main.networksMeta.ethereum[id] || {}
      const { nativeCurrency = {} } = existingMeta

      initial.main.networksMeta.ethereum[id] = {
        ...existingMeta,
        nativeCurrency: {
          ...nativeCurrency,
          name: nativeCurrency.name || name,
          symbol: nativeCurrency.symbol || symbol
        }
      }
    })

    return initial
  },
  35: (initial: any) => {
    const { shortcuts } = initial.main || {}
    const { altSlash: summonShortcutEnabled, ...otherShortcuts } = shortcuts || {}

    initial.main.shortcuts = {
      ...otherShortcuts,
      summon: {
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: summonShortcutEnabled,
        configuring: false
      }
    }

    return initial
  },
  36: (initial: any) => {
    if (
      initial?.main?.shortcuts?.summon &&
      typeof initial.main.shortcuts.summon === 'object' &&
      initial.main.shortcuts.summon.enabled === undefined
    ) {
      initial.main.shortcuts.summon.enabled = true
    }

    return initial
  },
  37: (initial: any) => {
    const replaceAltGr = () => (isWindows() ? ['Alt', 'Control'] : ['Alt'])
    const updateModifierKey = (key: string) => (key === 'AltGr' ? replaceAltGr() : key)

    const defaultShortcuts = {
      summon: {
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      }
    }

    const shortcutsSchema = z
      .object({
        summon: z.object({
          modifierKeys: z.array(z.string()),
          shortcutKey: z.string(),
          enabled: z.boolean(),
          configuring: z.boolean()
        })
      })
      .catch(defaultShortcuts)

    const result = shortcutsSchema.safeParse(initial.main.shortcuts)

    if (result.success) {
      const shortcuts = result.data

      const updatedSummonShortcut = {
        ...shortcuts.summon,
        modifierKeys: shortcuts.summon.modifierKeys.map(updateModifierKey).flat()
      }

      initial.main.shortcuts = {
        ...shortcuts,
        summon: updatedSummonShortcut
      }
    } else {
      log.error('Migration 37: Could not migrate shortcuts', result.error)
    }

    return initial
  }
}

// retrofit legacy migrations
const legacyMigrations = Object.entries(migrations).map(([version, legacyMigration]) => ({
  version: parseInt(version),
  migrate: (initial: unknown) => legacyMigration(initial)
}))

export default legacyMigrations
