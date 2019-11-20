const uuidv4 = require('uuid/v4')
const { URL } = require('url')

let trayInitial = true

module.exports = {
  // setSync: (u, key, payload) => u(key, () => payload),
  selectNetwork: (u, net) => {
    const reset = { status: 'loading', connected: false, type: '', network: '' }
    u('main.connection', connection => {
      connection.network = net
      connection.local = Object.assign({}, connection.local, reset)
      connection.secondary = Object.assign({}, connection.secondary, reset)
      return connection
    })
  },
  selectSecondary: (u, value) => {
    u('main.connection', connection => {
      connection.secondary.settings[connection.network].current = value
      return connection
    })
  },
  setSecondaryCustom: (u, target) => {
    u('main.connection', connection => {
      connection.secondary.settings[connection.network].options.custom = target
      return connection
    })
  },
  toggleConnection: (u, node, on) => u('main.connection', node, 'on', (value) => on !== undefined ? on : !value),
  setLocal: (u, status) => u('main.connection.local', local => Object.assign({}, local, status)),
  setSecondary: (u, status) => u('main.connection.secondary', secondary => Object.assign({}, secondary, status)),
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
    if (!path || path === '*' || path.startsWith('main') || path.startsWith('dock')) return // Don't allow updates to main state
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
  addDapp: (u, namehash, data, options) => {
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
  // Tray actions...
  // syncMain: (u, main) => u('main', _ => main),
  setSigner: (u, signer) => {
    u('selected.current', _ => signer.id)
    setTimeout(_ => {
      u('selected.minimized', _ => false)
      u('selected.open', _ => true)
    }, 50)
  },
  setSettingsView: (u, index, subindex = 0) => {
    u('selected.settings.viewIndex', () => index)
    u('selected.settings.subIndex', () => subindex)
  },
  setAddress: (u, address) => u('address', () => address),
  togglePanel: u => u('panel.show', show => !show),
  panelRequest: (u, request) => {
    request.host = request.host || (new URL(request.url)).host
    u('panel.request', v => request)
    u('panel.show', v => true)
  },
  setBalance: (u, account, balance) => u('balances', account, b => balance),
  notify: (u, type, data = {}) => {
    u('view.notify', _ => type)
    u('view.notifyData', _ => data)
  },
  toggleAddAccount: (u) => u('view.addAccount', show => !show),
  updateBadge: (u, type) => u('view.badge', _ => type),
  toggleSettings: u => {
    u('panel.view', view => view === 'settings' ? 'default' : 'settings')
  },
  trayOpen: (u, open) => {
    u('tray.open', _ => open)
    if (open && trayInitial) {
      trayInitial = false
      setTimeout(() => {
        u('tray.initial', _ => false)
      }, 30)
    }
  },
  setSignerView: (u, view) => {
    u('selected.showAccounts', _ => false)
    u('selected.view', _ => view)
  },
  accountPage: (u, page) => {
    u('selected.accountPage', () => page)
  },
  toggleShowAccounts: u => u('selected.showAccounts', _ => !_),
  addProviderEvent: (u, payload) => {
    u('provider.events', events => {
      events.push(payload.method)
      return events
    })
  },
  setView: (u, view) => u('selected.view', _ => view),
  toggleDataView: (u, id) => {
    u('selected.requests', id, 'viewData', view => !view)
  },
  updateExternalRates: (u, rates) => u('external.rates', () => rates),
  resetSigner: u => {
    u('selected.view', _ => 'default')
    u('selected.showAccounts', _ => false)
  },
  unsetSigner: u => {
    u('selected.minimized', _ => true)
    u('selected.open', _ => false)
    resetSigner(u) // These actions were moved from the app side
    setTimeout(_ => {
      u('selected', signer => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 520)
  },
  nodeProvider: (u, connected) => u('node.provider', _ => connected),
  setCurrent: (u, id) => u('view.current', _ => id),
  updateUrl: (u, id, url) => u('view.data', id, 'url', () => url),
  updateTitle: (u, id, title) => u('view.data', id, 'title', _ => title),
  reorderTabs: (u, from, to) => {
    u('view.list', list => {
      const _from = list[from]
      list[from] = list[to]
      list[to] = _from
      return list
    })
  },
  newView: (u) => {
    const id = uuidv4()
    u('view.current', _ => id)
    u('view.list', list => {
      list.push(id)
      return list
    })
    u('view.data', id, view => ({ url: 'https://www.google.com/', title: 'New Tab' }))
  },
  removeView: (u, id, isCurrent) => {
    u('view', view => {
      const index = view.list.indexOf(id)
      if (isCurrent) {
        if (index < view.list.length - 1) {
          view.current = view.list[index + 1]
        } else {
          view.current = view.list[index - 1]
        }
      }
      if (index > -1) view.list.splice(index, 1)
      delete view.data[id]
      return view
    })
  },
  initialSignerPos: (u, pos) => u('selected.position.initial', _ => pos),
  initialScrollPos: (u, pos) => u('selected.position.scrollTop', _ => pos)
}
