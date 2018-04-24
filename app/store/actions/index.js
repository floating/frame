import uuid from 'uuid/v4'
import { URL } from 'url'
import { ipcRenderer } from 'electron'

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const panelRequest = (u, request) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const setLaunch = (u, launch) => u('local.launch', _ => launch)

export const toggleLaunch = u => u('local.launch', launch => !launch)

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const runLocalNode = u => u('local.node.run', run => !run)
export const runOnStartup = u => u('local.startup', startup => !startup)

export const setSignerView = (u, view) => u('signer.view', _ => view)

export const setPermissions = (u, permissions) => {
  u('local.accounts', (accounts, state) => {
    accounts[state.signer.accounts[0]].permissions = permissions
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
  u('signer.minimized', _ => false)
  u('signer.open', _ => true)
  u('signer.view', _ => 'default')
  u('signer.requests', (requests, state) => {
    if (state.frame.type === 'tray' && state.signer.current !== '') ipcRenderer.send('frame:showTray')
    if (!request.handlerId) {
      let reqs = Object.keys(requests)
      let reqIndex = reqs.map(id => requests[id].origin).indexOf(request.origin)
      request.handlerId = reqIndex === -1 ? uuid() : requests[reqs[reqIndex]].handlerId
    }
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
  setTimeout(() => {
    u('signer.requests', requests => {
      delete requests[id]
      return requests
    })
  }, 1800)
}

export const requestError = (u, id, err) => {
  u('signer.requests', id, 'status', status => 'error')
  u('signer.requests', id, 'notice', notice => err.message)
  setTimeout(() => {
    u('signer.requests', requests => {
      delete requests[id]
      return requests
    })
  }, 1800)
}

export const declineRequest = (u, id) => {
  u('signer.requests', id, 'status', status => 'declined')
  u('signer.requests', id, 'notice', notice => 'Signature Declined')
  setTimeout(() => {
    u('signer.requests', requests => {
      delete requests[id]
      return requests
    })
  }, 1800)
}

export const updateSigners = (u, signers) => u('signers', _ => signers)

export const addSigner = (u, signer) => {
  u('local.accounts', signer.accounts[0], account => Object.assign({permissions: {}}, account))
  u('signers', signers => {
    signers.push(signer)
    signers.sort((a, b) => {
      if (a.id > b.id) return 1
      if (a.id < b.id) return -1
      return 0
    })
    return signers
  })
}

export const setSigner = (u, signer) => {
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

export const removeSigner = (u, signer) => {
  let status = 'Removing'

  u('signers', signers => {
    let target = signers.map(sign => sign.id).indexOf(signer.id)
    signers[target].removing = true
    return signers
  })

  setTimeout(_ => {
    u('signers', signers => {
      let target = signers.map(sign => sign.id).indexOf(signer.id)
      if (signers[target].removing) signers[target].status = status
      return signers
    })
    setTimeout(_ => {
      u('signers', signers => {
        let target = signers.map(sign => sign.id).indexOf(signer.id)
        if (target !== -1 && signers[target].status === status) signers.splice(target, 1)
        return signers
      })
    }, 3000)
  }, 1000)
}

export const updateSigner = (u, signer) => u('signers', signers => {
  let target = signers.map(sign => sign.id).indexOf(signer.id)
  signers[target] = signer
  return signers
})

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
  let id = uuid()
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
