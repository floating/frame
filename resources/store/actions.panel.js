// Panel view actions

const { v4 } = require('uuid')
const { URL } = require('url')

let trayInitial = true

module.exports = {
  updateAccountModule: (u, id, update) => {
    u('panel.account.modules', id, (module = {}) => {
      return Object.assign(module, update)
    })
  },
  stateSync: (u, _actions) => {
    try {
      const actions = JSON.parse(_actions)
      actions.forEach((action) => {
        action.updates.forEach((update) => {
          u(update.path, () => update.value)
        })
      })
    } catch (e) {
      console.error('State Syncing Error', e)
    }
  },
  syncPanel: (u, panel) => u('panel', () => panel),
  setSigner: (u, signer) => {
    u('selected.current', () => signer.id)
    u('selected.minimized', () => false)
  },
  setAddress: (u, address) => u('address', () => address),
  panelRequest: (u, request) => {
    request.host = request.host || new URL(request.url).host
    u('panel.request', () => request)
  },
  setBalance: (u, account, balance) => u('balances', account, () => balance),
  notify: (u, type, data = {}) => {
    u('view.notify', () => type)
    u('view.notifyData', () => data)
  },
  clickGuard: (u, on) => u('view.clickGuard', () => on),
  toggleAddAccount: (u) => u('view.addAccount', (show) => !show),
  toggleAddNetwork: (u) => u('view.addNetwork', (show) => !show),
  updateBadge: (u, type, version) => u('view.badge', () => ({ type, version })),
  setPanelView: (u, view) => u('panel.view', () => view),
  trayOpen: (u, open) => {
    u('tray.open', () => open)
    if (open && trayInitial) {
      trayInitial = false
      setTimeout(() => {
        u('tray.initial', () => false)
      }, 30)
    }
  },
  setSignerView: (u, view) => {
    u('selected.showAccounts', () => false)
    u('selected.view', () => view)
  },
  toggleShowAccounts: (u) => u('selected.showAccounts', (_) => !_),
  addProviderEvent: (u, payload) => {
    u('provider.events', (events) => {
      events.push(payload.method)
      return events
    })
  },
  toggleDataView: (u, id) => {
    u('selected.requests', id, 'viewData', (view) => !view)
  },
  updateExternalRates: (u, rates) => u('main.rates', () => rates),
  resetSigner: (u) => {
    u('selected.view', () => 'default')
    u('selected.showAccounts', () => false)
  },
  unsetSigner: (u) => {
    u('selected.minimized', () => true)
    this.resetSigner(u)
    setTimeout(() => {
      u('selected', (signer) => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 520)
  },
  nodeProvider: (u, connected) => u('node.provider', () => connected),
  setCurrent: (u, id) => u('view.current', () => id),
  updateUrl: (u, id, url) => u('view.data', id, 'url', () => url),
  updateTitle: (u, id, title) => u('view.data', id, 'title', () => title),
  reorderTabs: (u, from, to) => {
    u('view.list', (list) => {
      const _from = list[from]
      list[from] = list[to]
      list[to] = _from
      return list
    })
  },
  newView: (u) => {
    const id = v4()
    u('view.current', () => id)
    u('view.list', (list) => {
      list.push(id)
      return list
    })
    u('view.data', id, () => ({ url: 'https://www.google.com/', title: 'New Tab' }))
  },
  removeView: (u, id, isCurrent) => {
    u('view', (view) => {
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
  initialSignerPos: (u, pos) => u('selected.position.initial', () => pos),
  initialScrollPos: (u, pos) => u('selected.position.scrollTop', () => pos)
}
