import uuidv4 from 'uuid/v4'
import { URL } from 'url'

export const syncMain = (u, main) => u('main', _ => main)

export const setSigner = (u, signer) => {
  u('signer.current', _ => signer.id)
  u('signer.accounts', _ => signer.accounts)
  setTimeout(_ => {
    u('signer.minimized', _ => false)
    u('signer.open', _ => true)
  }, 50)
}

export const setAddress = (u, address) => u('address', () => address)

export const togglePanel = u => u('panel.show', show => !show)

export const panelRequest = (u, request) => {
  request.host = request.host || (new URL(request.url)).host
  u('panel.request', v => request)
  u('panel.show', v => true)
}

export const setBalance = (u, account, balance) => u('balances', account, b => balance)

export const notify = (u, type) => u('view.notify', _ => type)

export const updateAvailable = (u, res) => u('view.updateAvailable', () => res)

export const toggleSettings = u => {
  u('panel.view', view => view === 'settings' ? 'default' : 'settings')
}

export const trayOpen = (u, open) => u('tray.open', _ => open)

export const setSignerView = (u, view) => {
  u('signer.showAccounts', _ => false)
  u('signer.view', _ => view)
}

export const toggleShowAccounts = u => u('signer.showAccounts', _ => !_)

export const addProviderEvent = (u, payload) => {
  u('provider.events', events => {
    events.push(payload.method)
    return events
  })
}

export const setView = (u, view) => u('signer.view', _ => view)

export const toggleDataView = (u, id) => {
  u('signer.requests', id, 'viewData', view => !view)
}

export const updateSigners = (u, signers) => u('signers', _ => signers)

export const addSigner = (u, signer) => {
  if (signer.status === 'loading') return
  u('signers', signer.id, _ => signer)
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
      s.showAccounts = false
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
