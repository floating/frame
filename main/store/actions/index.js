const panelActions = require('./panel')

module.exports = {
  ...panelActions,
  // setSync: (u, key, payload) => u(key, () => payload),
  selectNetwork: (u, type, id) => {
    const reset = { status: 'loading', connected: false, type: '', network: '' }
    u('main.currentNetwork', selected => {
      u('main.networks', selected.type, selected.id, connection => {
        connection.primary = Object.assign({}, connection.primary, reset)
        connection.secondary = Object.assign({}, connection.secondary, reset)
        return connection
      })
      return { type, id }
    })
  },
  selectPrimary: (u, netType, netId, value) => {
    u('main.networks', netType, netId, 'connection.primary.current', () => value)
  },
  selectSecondary: (u, netType, netId, value) => {
    u('main.networks', netType, netId, 'connection.secondary.current', () => value)
  },
  setPrimaryCustom: (u, netType, netId, target) => {
    u('main.networks', netType, netId, 'connection.primary.custom', () => target)
  },
  setSecondaryCustom: (u, netType, netId, target) => {
    u('main.networks', netType, netId, 'connection.secondary.custom', () => target)
  },
  toggleConnection: (u, netType, netId, node, on) => {
    u('main.networks', netType, netId, 'connection', node, 'on', (value) => {
      return on !== undefined ? on : !value
    })
  },
  setPrimary: (u, netType, netId, status) => {
    u('main.networks', netType, netId, 'connection.primary', primary => {
      return Object.assign({}, primary, status)
    })
  },
  setSecondary: (u, netType, netId, status) => {
    u('main.networks', netType, netId, 'connection.secondary', secondary => {
      return Object.assign({}, secondary, status)
    })
  },
  setLaunch: (u, launch) => u('main.launch', _ => launch),
  toggleLaunch: u => u('main.launch', launch => !launch),
  toggleReveal: u => u('main.reveal', reveal => !reveal),
  toggleNonceAdjust: u => u('main.nonceAdjust', nonceAdjust => !nonceAdjust),
  setPermission: (u, address, permission) => {
    u('main.permissions', address, (permissions = {}) => {
      permissions[permission.handlerId] = permission
      return permissions
    })
  },
  clearPermissions: (u, address) => {
    u('main.permissions', address, () => {
      return {}
    })
  },
  toggleAccess: (u, address, handlerId) => {
    u('main.permissions', address, permissions => {
      permissions[handlerId].provider = !permissions[handlerId].provider
      return permissions
    })
  },
  setAccountCloseLock: (u, value) => {
    u('main.accountCloseLock', () => Boolean(value))
  },
  syncPath: (u, path, value) => {
    if (!path || path === '*' || path.startsWith('main')) return // Don't allow updates to main state
    u(path, () => value)
  },
  dontRemind: (u, version) => {
    u('main.updater.dontRemind', dontRemind => {
      if (dontRemind.indexOf(version) === -1) dontRemind.push(version)
      return dontRemind
    })
  },
  setBlockNumber: (u, network, id, blockNumber) => {
    u('main.networks', network, id, 'blockNumber', () => blockNumber)
  },
  updateAccount: (u, updatedAccount, add) => {
    u('main.accounts', updatedAccount.id, account => {
      // if (account) return updatedAccount // Account exists
      // if (add) return updatedAccount // Account is new and should be added
      return updatedAccount
    })
  },
  removeAccount: (u, id) => {
    u('main.accounts', accounts => {
      delete accounts[id]
      return accounts
    })
  },
  removeSigner: (u, id) => {
    u('main.signers', signers => {
      delete signers[id]
      return signers
    })
  },
  updateSigner: (u, signer) => {
    if (!signer.id) return
    u('main.signers', signer.id, () => signer)
  },
  newSigner: (u, signer) => {
    u('main.signers', signers => {
      signers[signer.id] = signer
      return signers
    })
  },
  // Ethereum and IPFS clients
  setClientState: (u, client, state) => u(`main.clients.${client}.state`, () => state),
  updateClient: (u, client, key, value) => u(`main.clients.${client}.${key}`, () => value),
  toggleClient: (u, client, on) => u(`main.clients.${client}.on`, (value) => on !== undefined ? on : !value),
  resetClient: (u, client, on) => {
    const data = { on: false, state: 'off', latest: false, installed: false, version: null }
    u(`main.clients.${client}`, () => data)
  },
  setLatticeSuffix:  (u, value) => {
    u('main.lattice.suffix', () => value)
  },
  setLatticePassword:  (u, value) => {
    u('main.lattice.password', () => value)
  },
  setLatticeEndpoint:  (u, value) => {
    u('main.lattice.endpoint', () => value)
  },
  setLatticeEndpointMode:  (u, value) => {
    u('main.lattice.endpointMode', () => value)
  },
  setLatticeAccountLimit:  (u, value) => {
    u('main.lattice.accountLimit', () => value)
  },
  setLatticeDeviceID:  (u, value) => {
    u('main.lattice.deviceID', () => value)
  },
  setLedgerDerivation: (u, value) => {
    u('main.ledger.derivation', () => value)
  },
  setLiveAccountLimit: (u, value) => {
    u('main.ledger.liveAccountLimit', () => value)
  },
  setHardwareDerivation: (u, value) => {
    u('main.hardwareDerivation', () => value)
  },
  setMenubarGasPrice: (u, value) => {
    u('main.menubarGasPrice', () => value)
  },
  muteAlphaWarning: (u) => {
    u('main.mute.alphaWarning', () => true)
  },
  muteWelcomeWarning: (u) => {
    u('main.mute.welcomeWarning', () => true)
  },
  toggleExplorerWarning: (u) => {
    u('main.mute.explorerWarning', v => !v)
  },
  toggleGasFeeWarning: (u) => {
    u('main.mute.gasFeeWarning', v => !v)
  },
  setAltSpace: (u, v) => {
    u('main.shortcuts.altSlash', () => v)
  },
  setAutohide: (u, v) => {
    u('main.autohide', () => v)
  },
  setGasPrices: (u, netType, netId, prices) => {
    u('main.networks', netType, netId, 'gas.price.levels', () => prices)
  },
  setGasDefault: (u, netType, netId, level, price) => {
    u('main.networks', netType, netId, 'gas.price.selected', () => level)
    if (level === 'custom') {
      u('main.networks', netType, netId, 'gas.price.levels.custom', () => price)
    } else {
      u('main.networks', netType, netId, 'gas.price.lastLevel', () => level)
    }
  },
  addNetwork: (u, net) => {
    const defaultNetwork = {
      id: 0,
      type: '',
      name: '',
      explorer: '',
      gas: {
        price: {
          selected: 'standard',
          levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        }
      },
      connection: {
        presets: { local: 'direct' },
        primary: { on: true, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' },
        secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
      }
    }
    u('main.networks', networks => {
      try {
        net.id = parseInt(net.id)
        if (
          typeof (parseInt(net.id)) !== 'number' ||
          typeof (net.type) !== 'string' ||
          typeof (net.name) !== 'string' ||
          typeof (net.explorer) !== 'string' ||
          typeof (net.symbol) !== 'string' ||
          ['ethereum'].indexOf(net.type) === -1
        ) {
          throw new Error('Invalid network settings')
        }
      } catch (e) {
        console.error(e)
        return networks
      }
      if (!networks[net.type]) networks[net.type] = {}
      if (networks[net.type][net.id]) return networks // Network already exists, don't overwrite, notify user
      const newNetwork = Object.assign({}, defaultNetwork, net)
      networks[net.type][net.id] = newNetwork
      return networks
    })
  },
  updateNetwork: (u, net, newNet) => {
    u('main', main => {
      try {
        if (
          typeof (parseInt(net.id)) !== 'number' ||
          typeof (net.type) !== 'string' ||
          typeof (net.name) !== 'string' ||
          typeof (net.explorer) !== 'string' ||
          typeof (net.symbol) !== 'string' ||
          ['ethereum'].indexOf(net.type) === -1
        ) {
          throw new Error('Invalid network settings')
        }
        if (
          typeof (parseInt(newNet.id)) !== 'number' ||
          typeof (newNet.type) !== 'string' ||
          typeof (newNet.name) !== 'string' ||
          typeof (newNet.explorer) !== 'string' ||
          typeof (newNet.symbol) !== 'string' ||
          ['ethereum'].indexOf(newNet.type) === -1
        ) {
          throw new Error('Invalid new network settings')
        }
      } catch (e) {
        console.error(e)
        return main
      }
      if (main.networks[newNet.type][newNet.id]) {
        if (net.type === newNet.type && net.id === newNet.id) {
          // Update data.without changing connection..
          Object.assign(main.networks[newNet.type][newNet.id], newNet)
        }
        return main
      } // Network already exists, don't overwrite, notify user
      const existingNet = Object.assign({}, main.networks[net.type][net.id])
      if (main.networks[net.type]) delete main.networks[net.type][net.id]
      if (!main.networks[newNet.type]) main.networks[newNet.type] = {}
      const updateNetwork = Object.assign(existingNet, newNet)
      main.networks[newNet.type][newNet.id] = updateNetwork
      if (main.currentNetwork.type === net.type && main.currentNetwork.id === net.id) { // Change selected network if it's being changed
        const reset = { status: 'loading', connected: false, type: '', network: '' }
        main.currentNetwork = { type: newNet.type, id: newNet.id }
        main.networks[newNet.type][newNet.id].primary = Object.assign({}, main.networks[newNet.type][newNet.id].primary, reset)
        main.networks[newNet.type][newNet.id].secondary = Object.assign({}, main.networks[newNet.type][newNet.id].secondary, reset)
      }
      return main
    })
  },
  removeNetwork: (u, net) => {
    u('main', main => {
      let netCount = 0
      Object.keys(main.networks[net.type]).forEach(id => {
        netCount++
      })
      if (netCount <= 1) return main // Cannot delete last network without adding a new network of this type first
      if (main.networks[net.type]) delete main.networks[net.type][net.id]
      if (main.currentNetwork.type === net.type && main.currentNetwork.id === net.id) { // Change selected network if it's deleted while selected
        const id = Object.keys(main.networks[net.type]).map(i => parseInt(i)).sort((a, b) => a - b)[0].toString()
        const reset = { status: 'loading', connected: false, type: '', network: '' }
        main.currentNetwork = { type: net.type, id }
        main.networks[net.type][id].primary = Object.assign({}, main.networks[net.type][id].primary, reset)
        main.networks[net.type][id].secondary = Object.assign({}, main.networks[net.type][id].secondary, reset)
      }
      return main
    })
  },
  // Flow
  addDapp: (u, namehash, data, options = { docked: false, added: false }) => {
    u(`main.dapp.details.${namehash}`, () => data)
    u('main.dapp.map', map => {
      if (options.docked && map.docked.length <= 10) {
        map.docked.push(namehash)
      } else {
        map.added.unshift(namehash)
      }
      return map
    })
  },
  setDappOpen: (u, ens, open) => {
    u('main.openDapps', (dapps) => {
      if (open) {
        if (dapps.indexOf(ens) === -1) dapps.push(ens)
      } else {
        dapps = dapps.filter(e => e !== ens)
      }
      return dapps
    })
  },
  removeDapp: (u, namehash) => {
    u('main.dapp.details', (dapps) => {
      dapps = { ...dapps }
      delete dapps[namehash]
      return dapps
    })
    u('main.dapp.map', map => {
      let index = map.added.indexOf(namehash)
      if (index !== -1) {
        map.added.splice(index, 1)
      } else {
        index = map.docked.indexOf(namehash)
        if (index !== -1) map.docked.splice(index, 1)
      }
      return map
    })
  },
  moveDapp: (u, fromArea, fromIndex, toArea, toIndex) => {
    u('main.dapp.map', map => {
      const hash = map[fromArea][fromIndex]
      map[fromArea].splice(fromIndex, 1)
      map[toArea].splice(toIndex, 0, hash)
      return map
    })
  },
  updateDapp: (u, namehash, data) => {
    u(`main.dapp.details.${namehash}`, (oldData) => {
      return { ...oldData, ...data }
    })
  },
  setDappStorage: (u, hash, state) => {
    if (state) u(`main.dapp.storage.${hash}`, () => state)
  },
  expandDock: (u, expand) => {
    u('dock.expand', (s) => expand)
  },
  pin: (u) => {
    u('main.pin', pin => !pin)
  },
  saveAccount: (u, id) => {
    u('main.save.account', () => id)
  },
  setIPFS: (u, ipfs) => {
    u('main.ipfs', () => ipfs)
  },
  setRates: (u, rates) => {
    u('external.rates', (existingRates = {}) => rates)
  },
  setBalance: (u, address, symbol, balance) => {
    u('main.accounts', address, 'balances', (balances = {}) => {
      const updates = {
        ...balances,
        [symbol]: balance
      }

      return updates
    })
  },
  // Tokens
  setBalances: (u, address, newBalances) => {
    u('main.accounts', address, 'balances', (balances = {}) => {
      const updatedBalances = Object.entries(newBalances).reduce((acc, [symbol, token]) => {
        acc[symbol] = token
        return acc
      }, {})

      const updates = { ...balances, ...updatedBalances }

      return updates
    })
  },
  omitToken: (u, address, omitToken) => {
    u('main.accounts', address, 'tokens.omit', omit => {
      omit = omit || []
      if (omit.indexOf(omitToken) === -1) omit.push(omitToken)
      return omit
    })
  },
  setColorway: (u, colorway) => {
    u('main.colorway', () => {
      return colorway
    })
  },
  // Dashboard
  setDashType: (u, type) => {
    // console.log('set dash type', type)
    u('dash.type', () => type)
  },
  toggleDash: (u, force) => {
    u('dash.showing', s => force === 'hide' ? false : force === 'show' ? true : !s)
  },
  // toggleUSDValue: (u) => {
  //   u('main.showUSDValue', show => !show)
  // }
  // __overwrite: (path, value) => u(path, () => value)
}
