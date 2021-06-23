const log = require('electron-log')

const migrations = {
  5: initial=> { // Add Polygon to persisted networks
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
    return initial
  },
  6: initial => { // If previous hardwareDerivation is testnet, set that for split ledger/trezor derevation
    if (initial.main.hardwareDerivation === 'testnet') {
      initial.main.ledger.derivation = 'testnet'
      initial.main.trezor.derivation = 'testnet'
    }
    return initial
  },
  7: initial => { // Move account to become cross chain accounts
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
    
    // Before the v6 state migration
    // If users have very old state they will first need to do an older account migration
    moveOldAccountsToNewAddresses()
  
    // Once this is complete they can now do the current account migration
    const newAccounts = {}
    // const nameCount = {}
    let { accounts, addresses } = initial.main
    accounts = JSON.parse(JSON.stringify(accounts))
    addresses = JSON.parse(JSON.stringify(addresses))
    Object.keys(addresses).forEach(address => {
      // Normalize address case
      addresses[address.toLowerCase()] = addresses[address]
      address = address.toLowerCase()
  
      const hasPermissions = addresses[address] && addresses[address].permissions && Object.keys(addresses[address].permissions).length > 0
      // const hasTokens = addresses[address] && addresses[address].tokens && Object.keys(addresses[address].tokens).length > 0
      if (!hasPermissions) return log.info(`Address ${address} did not have any permissions or tokens`)
  
      // Copy Account permissions
      initial.main.permissions[address] = addresses[address] && addresses[address].permissions ? Object.assign({}, addresses[address].permissions) : {}
  
      const matchingAccounts = []
      Object.keys(accounts).sort((a, b) => accounts[a].created > accounts[b].created ? 1 : -1).forEach(id => {
        if (accounts[id].addresses && accounts[id].addresses.map && accounts[id].addresses.map(a => a.toLowerCase()).indexOf(address) > -1) {
          matchingAccounts.push(id)
        }
      })
      if (matchingAccounts.length > 0) {
        const primaryAccount = matchingAccounts.sort((a, b) => {
          return accounts[a].addresses.length === accounts[b].addresses.length ? 0 : accounts[a].addresses.length > accounts[b].addresses.length ? -1 : 1
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
        newAccounts[address].tokens = addresses[address] && addresses[address].tokens ? addresses[address].tokens : {}
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
  8: initial => { // Add on/off value to chains
    Object.keys(initial.main.networks.ethereum).forEach(chainId => {
      initial.main.networks.ethereum[chainId].on = chainId === '1' || chainId === initial.main.currentNetwork.id ? true : false
    })
  
    return initial
  },
  9: initial => {
    Object.keys(initial.main.networks.ethereum).forEach(chainId => {
      if (chainId === '1') {
        initial.main.networks.ethereum[chainId].layer = 'mainnet'
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
  10: initial=> {  // Add Optimisim to persisted networks
    if (!initial.main.networks.ethereum[10]) {

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
          primary: { on: true, current: 'optimism', status: 'loading', connected: false, type: '', network: '', custom: '' },
          secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
        },
        on: false
      }
    }
    return initial
  }
}

module.exports = {
  // Apply migrations to current state
  apply: state => {
    state.main._version = state.main._version || 0
    Object.keys(migrations).sort((a, b) => a - b).forEach(version => {
      if (state.main._version < version) {
        console.log('applying state migration ', version)
        state = migrations[version](state)
        state.main._version = version
      }
    })
    return state
  },
  // Version number of latest known migration
  latest: Math.max(...Object.keys(migrations))
}