import uuidv4 from 'uuid/v4'
import uuidv5 from 'uuid/v5'
import { URL } from 'url'

import link from '../../link'

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const setConnection = (u, connection) => u('local.connection', c => connection)

export const panelRequest = (u, request) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const setBalance = (u, account, balance) => u('balances', account, b => balance)

export const notify = (u, type) => u('view.notify', _ => type)

export const enableMainnet = u => u('local.enableMainnet', () => true)

export const selectNetwork = (u, net) => {
  let reset = { status: 'loading', connected: false, type: '', network: '' }
  u('local.connection', connection => {
    connection.network = net
    connection.local = Object.assign({}, connection.local, reset)
    connection.secondary = Object.assign({}, connection.secondary, reset)
    return connection
  })
}

export const selectSecondary = (u, direction) => {
  if (direction === '->') {
    u('local.connection', connection => {
      let options = Object.keys(connection.secondary.settings[connection.network].options)
      let index = options.indexOf(connection.secondary.settings[connection.network].current) + 1
      if (index >= options.length) index = 0
      connection.secondary.settings[connection.network].current = options[index]
      return connection
    })
  } else if (direction === '<-') {
    u('local.connection', connection => {
      let options = Object.keys(connection.secondary.settings[connection.network].options)
      let index = options.indexOf(connection.secondary.settings[connection.network].current) - 1
      if (index < 0) index = options.length - 1
      connection.secondary.settings[connection.network].current = options[index]
      return connection
    })
  }
}

export const setSecondaryCustom = (u, target) => {
  u('local.connection', connection => {
    connection.secondary.settings[connection.network].options.custom = target
    return connection
  })
}

export const setLocal = (u, status) => u('local.connection.local', local => Object.assign({}, local, status))
export const setSecondary = (u, status) => u('local.connection.secondary', secondary => Object.assign({}, secondary, status))

export const setLaunch = (u, launch) => u('local.launch', _ => launch)

export const toggleLaunch = u => u('local.launch', launch => !launch)

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const toggleConnection = (u, node) => u('local.connection', node, 'on', on => !on)

export const trayOpen = (u, open) => u('tray.open', _ => open)

export const runLocalNode = u => u('local.node.run', run => !run)
export const runOnStartup = u => u('local.startup', startup => !startup)

export const setSignerView = (u, view) => {
  u('signer.showAccounts', _ => false)
  u('signer.view', _ => view)
}

export const toggleShowAccounts = u => u('signer.showAccounts', _ => !_)

export const setPermissions = (u, permissions) => {
  u('local.accounts', (accounts, state) => {
    let currentSigner = state.signers[state.signer.current]
    let currentAccount = currentSigner.accounts[currentSigner.index]
    accounts[currentAccount].permissions = permissions
    return accounts
  })
}

export const clearPermissions = (u, permissions) => {
  u('local.accounts', (accounts, state) => {
    let currentSigner = state.signers[state.signer.current]
    let currentAccount = currentSigner.accounts[currentSigner.index]
    accounts[currentAccount].permissions = {}
    return accounts
  })
}

export const setDefaultNode = (u, url) => {
  u('local.accounts', (accounts, state) => {
    let currentSigner = state.signers[state.signer.current]
    let currentAccount = currentSigner.accounts[currentSigner.index]
    accounts[currentAccount].node = url
    return accounts
  })
}

export const addProviderEvent = (u, payload) => {
  u('provider.events', events => {
    events.push(payload.method)
    return events
  })
}

export const setView = (u, view) => u('signer.view', _ => view)

export const giveAccess = (u, req, access) => {
  u('local.accounts', req.account, (account) => {
    account = account || { permissions: {} }
    account.permissions[req.handlerId] = { handlerId: req.handlerId, origin: req.origin, provider: access }
    return account
  })
  link.rpc('removeRequest', req, () => {}) // Move to link.send
}

export const toggleAccess = (u, handlerId) => {
  u('local.accounts', (accounts, state) => {
    let a = state.signer.accounts[0]
    accounts[a].permissions[handlerId].provider = !accounts[a].permissions[handlerId].provider
    return accounts
  })
}

export const toggleDataView = (u, id) => {
  u('signer.requests', id, 'viewData', view => !view)
}

export const updateSigners = (u, signers) => u('signers', _ => signers)

export const addSigner = (u, signer) => {
  if (signer.status === 'loading') return
  u('local.accounts', signer.accounts[0], account => Object.assign({ permissions: {} }, account))
  u('signers', signer.id, _ => signer)
}

export const setSigner = (u, signer) => {
  u('local.accounts', (accounts, state) => {
    let a = signer.accounts[0]
    if (accounts[a] && accounts[a].permissions) delete accounts[a].permissions[uuidv5('Unknown', uuidv5.DNS)]
    return accounts
  })
  u('signer.current', _ => signer.id)
  u('signer.accounts', _ => signer.accounts)
  setTimeout(_ => {
    u('signer.minimized', _ => false)
    u('signer.open', _ => true)
  }, 50)
}

export const updateExternalRates = (u, rates) => u('external.rates', () => rates)

export const resetSigner = u => {
  u('signer.view', _ => 'default')
  u('signer.showAccounts', _ => false)
}

export const unsetSigner = u => {
  u('signer.minimized', _ => true)
  u('signer.open', _ => false)
  resetSigner(u)
  setTimeout(_ => {
    u('signer', signer => {
      signer.last = signer.current
      signer.current = ''
      signer.accounts = []
      signer.requests = {}
      signer.view = 'default'
      return signer
    })
  }, 520)
}

export const nodeProvider = (u, connected) => u('node.provider', _ => connected)

export const removeSigner = (u, signer, state) => {
  let status = 'Removing'
  u('signers', (signers, state) => {
    if (state.signer.current === signer.id) unsetSigner(u)
    if (signers[signer.id] && signers[signer.id]) signers[signer.id].removing = true
    return signers
  })
  setTimeout(_ => {
    u('signers', signers => {
      if (signers[signer.id] && signers[signer.id].removing) signers[signer.id].status = status
      return signers
    })
  }, 1200)
  setTimeout(_ => {
    u('signers', signers => {
      if (signers[signer.id] && signers[signer.id].removing && signers[signer.id].status === status) delete signers[signer.id]
      return signers
    })
  }, 4200)
}

export const updateSigner = (u, signer) => {
  u('signers', signer.id, _ => signer)
  u('signer', s => {
    if (s.current === signer.id && (signer.status !== 'ok' || signer.accounts[0] !== s.accounts[0])) {
      s.last = s.current
      s.current = ''
      s.accounts = []
      s.requests = {}
      s.view = 'default'
      s.minimized = true
      s.open = false
    }
    return s
  })
}

export const setCurrent = (u, id) => u('view.current', _ => id)
export const updateUrl = (u, id, url) => u('view.data', id, 'url', () => url)
export const updateTitle = (u, id, title) => u('view.data', id, 'title', _ => title)
export const reorderTabs = (u, from, to) => {
  u('view.list', list => {
    let _from = list[from]
    list[from] = list[to]
    list[to] = _from
    return list
  })
}
export const newView = (u) => {
  let id = uuidv4()
  u('view.current', _ => id)
  u('view.list', list => {
    list.push(id)
    return list
  })
  u('view.data', id, view => ({ url: 'https://www.google.com/', title: 'New Tab' }))
}

export const removeView = (u, id, isCurrent) => {
  u('view', view => {
    let index = view.list.indexOf(id)
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
}

export const initialSignerPos = (u, pos) => u('signer.position.initial', _ => pos)
export const initialScrollPos = (u, pos) => u('signer.position.scrollTop', _ => pos)
