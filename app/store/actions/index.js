import uuidv4 from 'uuid/v4'
import uuidv5 from 'uuid/v5'
import { URL } from 'url'
import { ipcRenderer } from 'electron'

const remove = (obj, id) => {
  if (obj[id]) delete obj[id]
  return obj
}

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const panelRequest = (u, request) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const setLaunch = (u, launch) => u('local.launch', _ => launch)

export const hadSuccess = u => u('local.success', _ => true)

export const toggleLaunch = u => u('local.launch', launch => !launch)

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const trayOpen = (u, open) => u('tray.open', _ => open)

export const runLocalNode = u => u('local.node.run', run => !run)
export const runOnStartup = u => u('local.startup', startup => !startup)

export const setSignerView = (u, view) => u('signer.view', _ => view)

export const setPermissions = (u, permissions) => {
  u('local.accounts', (accounts, state) => {
    accounts[state.signer.accounts[0]].permissions = permissions
    return accounts
  })
}

export const clearPermissions = (u, permissions) => {
  u('local.accounts', (accounts, state) => {
    accounts[state.signer.accounts[0]].permissions = {}
    return accounts
  })
}

export const setDefaultNode = (u, url) => {
  u('local.accounts', (accounts, state) => {
    accounts[state.signer.accounts[0]].node = url
    return accounts
  })
}

export const addProviderEvent = (u, payload) => {
  u('provider.events', events => {
    events.push(payload.method)
    return events
  })
}

export const addRequest = (u, request) => {
  u('signer.requests', (requests, state) => {
    if (!request.handlerId && request.type === 'requestProvider') {
      let reqs = Object.keys(requests)
      let reqIndex = reqs.filter(id => requests[id].type === 'requestProvider').map(id => requests[id].origin).indexOf(request.origin)
      if (reqIndex === -1) {
        request.handlerId = uuidv5(request.origin, uuidv5.DNS)
        if (state.frame.type === 'tray' && state.signer.current) ipcRenderer.send('frame:showTray')
      } else {
        request.handlerId = requests[reqs[reqIndex]].handlerId
      }
    } else {
      if (state.frame.type === 'tray' && state.signer.current) ipcRenderer.send('frame:showTray')
    }
    if (!request.handlerId) throw new Error('No handlerId for added request...', request)
    requests[request.handlerId] = request
    return requests
  })
}

export const giveAccess = (u, req, access) => {
  u('local.accounts', (accounts, state) => {
    let a = state.signer.accounts[0]
    accounts[a] = accounts[a] || {permissions: {}}
    accounts[a].permissions[req.handlerId] = {handlerId: req.handlerId, origin: req.origin, provider: access}
    return accounts
  })
  u('signer.requests', (requests, state) => {
    delete requests[req.handlerId]
    return requests
  })
}

export const toggleAccess = (u, handlerId) => {
  u('local.accounts', (accounts, state) => {
    let a = state.signer.accounts[0]
    accounts[a].permissions[handlerId].provider = !accounts[a].permissions[handlerId].provider
    return accounts
  })
}

export const requestPending = (u, id) => {
  u('signer.requests', id, 'status', status => 'pending')
  u('signer.requests', id, 'notice', notice => 'Signature Pending')
}

export const requestSuccess = (u, id, res) => {
  u('signer.requests', id, 'status', status => 'success')
  u('signer.requests', id, 'notice', notice => 'Signature Succesful')
  setTimeout(() => u('signer.requests', requests => remove(requests, id)), 1800)
}

export const requestError = (u, id, err) => {
  u('signer.requests', id, 'status', status => 'error')
  if (err.message === 'signTransaction Error: "Ledger device: Invalid data received (0x6a80)"') { // TODO: Error Codes
    u('signer.requests', id, 'notice', notice => 'Ledger Contract Data = No')
  } else {
    u('signer.requests', id, 'notice', notice => 'Signature Error')
  }

  setTimeout(() => u('signer.requests', requests => remove(requests, id)), 3300)
}

export const declineRequest = (u, id) => {
  u('signer.requests', id, 'status', status => 'declined')
  u('signer.requests', id, 'notice', notice => 'Signature Declined')
  setTimeout(() => u('signer.requests', requests => remove(requests, id)), 1800)
}

export const updateSigners = (u, signers) => u('signers', _ => signers)

export const addSigner = (u, signer) => {
  if (signer.status === 'loading') return
  u('local.accounts', signer.accounts[0], account => Object.assign({permissions: {}}, account))
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

export const unsetSigner = u => {
  u('signer.minimized', _ => true)
  u('signer.open', _ => false)
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

export const removeSigner = (u, signer) => {
  let status = 'Removing'
  u('signers', signers => {
    if (signers[signer.id]) signers[signer.id].removing = true
    return signers
  })
  setTimeout(_ => {
    u('signers', signers => {
      if (signers[signer.id].removing) signers[signer.id].status = status
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
    if (s.current === signer.id && signer.status !== 'ok') {
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
  u('view.data', id, view => ({url: 'https://www.google.com/', title: 'New Tab'}))
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
