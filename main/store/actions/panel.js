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
  //   pathSync: (u, path, value) => u(path, () => value),
  //   syncPanel: (u, panel) => u('panel', _ => panel),
  setSigner: (u, signer) => {
    u('selected.current', (_) => signer.id)
    u('selected.minimized', (_) => false)
    u('selected.open', (_) => true)
  },

  setSettingsView: (u, index, subindex = 0) => {
    u('selected.settings.viewIndex', () => index)
    u('selected.settings.subIndex', () => subindex)
  },
  setAddress: (u, address) => u('address', () => address),
  togglePanel: (u) => u('panel.show', (show) => !show),
  panelRequest: (u, request) => {
    request.host = request.host || new URL(request.url).host
    u('panel.request', (v) => request)
    u('panel.show', (v) => true)
  },
  setBalance: (u, account, balance) => u('balances', account, (b) => balance),
  notify: (u, type, data = {}) => {
    u('view.notify', (_) => type)
    u('view.notifyData', (_) => data)
  },
  clickGuard: (u, on) => u('view.clickGuard', () => on),
  toggleAddAccount: (u) => u('view.addAccount', (show) => !show),
  toggleAddNetwork: (u) => u('view.addNetwork', (show) => !show),
  updateBadge: (u, type, version) => u('view.badge', () => ({ type, version })),
  toggleSettings: (u) => {
    u('panel.view', (view) => (view === 'settings' ? 'default' : 'settings'))
  },
  setPanelView: (u, view) => u('panel.view', () => view),
  trayOpen: (u, open) => {
    u('tray.open', (_) => open)
    if (open && trayInitial) {
      trayInitial = false
      setTimeout(() => {
        u('tray.initial', (_) => false)
      }, 30)
    }
  },
  setSignerView: (u, view) => {
    u('selected.showAccounts', (_) => false)
    u('selected.view', (_) => view)
  },
  accountPage: (u, page) => {
    u('selected.accountPage', () => page)
  },
  toggleShowAccounts: (u) => u('selected.showAccounts', (_) => !_),
  addProviderEvent: (u, payload) => {
    u('provider.events', (events) => {
      events.push(payload.method)
      return events
    })
  },
  setView: (u, view) => u('selected.view', (_) => view),
  toggleDataView: (u, id) => {
    u('selected.requests', id, 'viewData', (view) => !view)
  },
  updateExternalRates: (u, rates) => u('main.rates', () => rates),
  resetSigner: (u) => {
    u('selected.view', (_) => 'default')
    u('selected.showAccounts', (_) => false)
  },
  unsetSigner: (u) => {
    u('selected.minimized', (_) => true)
    u('selected.open', (_) => false)
    resetSigner(u)
    setTimeout((_) => {
      u('selected', (signer) => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 520)
  },
  nodeProvider: (u, connected) => u('node.provider', (_) => connected),
  setCurrent: (u, id) => u('view.current', (_) => id),
  updateUrl: (u, id, url) => u('view.data', id, 'url', () => url),
  updateTitle: (u, id, title) => u('view.data', id, 'title', (_) => title),
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
    u('view.current', (_) => id)
    u('view.list', (list) => {
      list.push(id)
      return list
    })
    u('view.data', id, (view) => ({ url: 'https://www.google.com/', title: 'New Tab' }))
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
  initialSignerPos: (u, pos) => u('selected.position.initial', (_) => pos),
  initialScrollPos: (u, pos) => u('selected.position.scrollTop', (_) => pos),
}
