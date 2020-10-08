module.exports = {
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
  toggleConnection: (u, netType, netId, node, on) => u('main', netType, netId, 'connection', node, 'on', (value) => on !== undefined ? on : !value),
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
  clearPermissions: (u, address) => {
    u('main.addresses', address, address => {
      address.permissions = {}
      return address
    })
  },
  giveAccess: (u, req, access) => {
    u('main.addresses', req.address, address => {
      address = address || { permissions: {} }
      address.permissions[req.handlerId] = { handlerId: req.handlerId, origin: req.origin, provider: access }
      return address
    })
  },
  toggleAccess: (u, address, handlerId) => {
    u('main.addresses', address, address => {
      address.permissions[handlerId].provider = !address.permissions[handlerId].provider
      return address
    })
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
  updateAccount: (u, updatedAccount, add) => {
    u('main.accounts', updatedAccount.id, account => {
      if (account) return updatedAccount // Account exists
      if (add) return updatedAccount // Account is new and should be added
      return account
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
  moveOldAccountsToNewAddresses: (u, signer) => {
    const addressesToMove = {}
    u('main.accounts', accounts => {
      Object.keys(accounts).forEach(id => {
        if (id.startsWith('0x')) {
          addressesToMove[id] = accounts[id]
          delete accounts[id]
        }
      })
      return accounts
    })
    u('main.addresses', addresses => {
      Object.keys(addressesToMove).forEach(id => {
        addresses[id] = addressesToMove[id]
      })
      return addresses
    })
  },
  setLedgerDerivation: (u, value) => {
    u('main.ledger.derivation', () => value)
  },
  muteAlphaWarning: (u) => {
    u('main.mute.alphaWarning', () => true)
  },
  setGasPrices: (u, netType, netId, prices) => {
    u('main.netwotks', netType, netId, 'gas.price.levels', () => prices)
  },
  setGasDefault: (u, netType, netId, level, price) => {
    u('main.netwotks', netType, netId, 'gas.price.selected', () => level)
    if (level === 'custom') u('main.netwotks', netType, netId, 'gas.price.levels.custom', () => price)
  }
  // __overwrite: (path, value) => u(path, () => value)
}
