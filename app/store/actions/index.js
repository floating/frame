import { v4 } from 'uuid'
import { URL } from 'url'

// export const syncMain = (u, main) => u('main', _ => main)

export const pathSync = (u, path, value) => u(path, () => value)

// export const syncPanel = (u, panel) => u('panel', _ => panel)

// Convert to synthetic actions

export const setSigner = (u, signer) => {
  u('selected.current', _ => signer.id)
  u('selected.minimized', _ => false)
  u('selected.open', _ => true)
  // setTimeout(_ => {

  // }, 50)
}

export const setSettingsView = (u, index, subindex = 0) => {
  u('selected.settings.viewIndex', () => index)
  u('selected.settings.subIndex', () => subindex)
}

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const panelRequest = (u, request) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const setBalance = (u, account, balance) => u('balances', account.toLowerCase(), b => balance)

export const notify = (u, type, data = {}) => {
  u('view.notify', _ => type)
  u('view.notifyData', _ => data)
}

export const clickGuard = (u, on) => u('view.clickGuard', () => on)

export const toggleAddAccount = (u) => u('view.addAccount', show => !show)

export const toggleAddNetwork = (u) => u('view.addNetwork', show => !show)

export const updateBadge = (u, type) => u('view.badge', _ => type)

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const setPanelView = (u, view) => u('panel.view', () => view)

let trayInitial = true
export const trayOpen = (u, open) => {
  u('tray.open', _ => open)
  if (open && trayInitial) {
    trayInitial = false
    setTimeout(() => {
      u('tray.initial', _ => false)
    }, 30)
  }
}

export const setSignerView = (u, view) => {
  u('selected.showAccounts', _ => false)
  u('selected.view', _ => view)
}

export const accountPage = (u, page) => {
  u('selected.accountPage', () => page)
}

export const toggleShowAccounts = u => u('selected.showAccounts', _ => !_)

export const addProviderEvent = (u, payload) => {
  u('provider.events', events => {
    events.push(payload.method)
    return events
  })
}

export const setView = (u, view) => u('selected.view', _ => view)

export const toggleDataView = (u, id) => {
  u('selected.requests', id, 'viewData', view => !view)
}

export const updateExternalRates = (u, rates) => u('external.rates', () => rates)

export const resetSigner = u => {
  u('selected.view', _ => 'default')
  u('selected.showAccounts', _ => false)
}

export const unsetSigner = u => {
  u('selected.minimized', _ => true)
  u('selected.open', _ => false)
  resetSigner(u)
  setTimeout(_ => {
    u('selected', signer => {
      signer.last = signer.current
      signer.current = ''
      signer.requests = {}
      signer.view = 'default'
      return signer
    })
  }, 520)
}

export const nodeProvider = (u, connected) => u('node.provider', _ => connected)

// export const removeSigner = (u, signer, state) => {
//   let status = 'Removing'
//   u('signers', (signers, state) => {
//     if (state.signer.current === signer.id) unsetSigner(u)
//     if (signers[signer.id]) signers[signer.id].removing = true
//     return signers
//   })
//   setTimeout(_ => {
//     u('signers', signers => {
//       if (signers[signer.id] && signers[signer.id].removing) signers[signer.id].status = status
//       return signers
//     })
//   }, 1200)
//   setTimeout(_ => {
//     u('signers', signers => {
//       if (signers[signer.id] && signers[signer.id].removing && signers[signer.id].status === status) delete signers[signer.id]
//       return signers
//     })
//   }, 4200)
// }

// export const updateSigner = (u, signer) => {
//   u('signers', signer.id, _ => signer)
//   u('selected', s => {
//     if (s.current === signer.id && (signer.status !== 'ok' || signer.accounts[0] !== s.accounts[0])) {
//       s.last = s.current
//       s.current = ''
//       s.accounts = []
//       s.requests = {}
//       s.view = 'default'
//       s.minimized = true
//       s.open = false
//       s.showAccounts = false
//     }
//     return s
//   })
// }

export const setCurrent = (u, id) => u('view.current', _ => id)
export const updateUrl = (u, id, url) => u('view.data', id, 'url', () => url)
export const updateTitle = (u, id, title) => u('view.data', id, 'title', _ => title)
export const reorderTabs = (u, from, to) => {
  u('view.list', list => {
    const _from = list[from]
    list[from] = list[to]
    list[to] = _from
    return list
  })
}
export const newView = (u) => {
  const id = v4()
  u('view.current', _ => id)
  u('view.list', list => {
    list.push(id)
    return list
  })
  u('view.data', id, view => ({ url: 'https://www.google.com/', title: 'New Tab' }))
}

export const removeView = (u, id, isCurrent) => {
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
}

export const initialSignerPos = (u, pos) => u('selected.position.initial', _ => pos)
export const initialScrollPos = (u, pos) => u('selected.position.scrollTop', _ => pos)
