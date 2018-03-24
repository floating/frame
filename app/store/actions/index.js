import uuid from 'uuid/v4'
import { URL } from 'url'
import { ipcRenderer } from 'electron'

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const panelRequest = (u, request, cb) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const runLocalNode = u => u('local.node.run', run => !run)
export const runOnStartup = u => u('local.startup', startup => !startup)

export const toggelSignerSettings = u => {
  u('signer.view', view => view === 'settings' ? 'default' : 'settings')
}

export const setPermissions = (u, permissions) => u('permissions', () => permissions)

export const addProviderEvent = (u, payload) => {
  u('provider.events', events => {
    events.push(payload.method)
    return events
  })
}

export const addRequest = (u, request) => {
  u('signer.requests', (requests, state) => {
    if (state.frame.type === 'tray') ipcRenderer.send('frame:showTray')
    if (request.type === 'approveTransaction') requests[request.handlerId] = request
    if (request.type === 'requestProvider') requests[request.origin.replace('.', '')] = request
    return requests
  })
}

export const giveAccess = (u, req, access) => {
  let origin = req.origin.replace('.', '')
  u('permissions', origin, _ => ({origin: req.origin, provider: access}))
  u('signer.requests', (requests, state) => {
    delete requests[origin]
    return requests
  })
}

export const toggleAccess = (u, origin) => {
  u('permissions', origin.replace('.', ''), 'provider', provider => !provider)
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

export const addHostPermission = (u, host, permission) => {
  u('permissions', permissions => {
    permissions[host] = permissions[host] || []
    permissions[host].push(permission)
    return permissions
  })
}

export const updateSigners = (u, signers) => u('signers', _ => signers)

export const addSigner = (u, signer) => u('signers', signers => {
  signers.push(signer)
  signers.sort((a, b) => {
    if (a.id > b.id) return 1
    if (a.id < b.id) return -1
    return 0
  })
  return signers
})

export const setSigner = (u, signer) => {
  u('signer.current', _ => signer.id)
  u('signer.minimized', _ => false)
}

export const toggleMinimized = (u, signer) => {
  u('signer.minimized', minimized => !minimized)
}

export const removeSigner = (u, signer) => u('signers', signers => {
  let target = signers.map(sign => sign.id).indexOf(signer.id)
  if (target !== -1) signers.splice(target, 1)
  return signers
})

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
