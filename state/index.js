const PersistStore = require('electron-store')
const persist = new PersistStore()
const get = (path, obj = persist.get('local')) => {
  path.split('.').some((key, i) => {
    if (typeof obj !== 'object') { obj = undefined } else { obj = obj[key] }
    return obj === undefined // Stop navigating the path if we get to undefined value
  })
  return obj
}
const local = (path, def) => {
  let found = get(path)
  if (found === undefined) return def
  return found
}

let initial = {
  panel: {
    show: false,
    view: 'default'
  },
  view: { current: '', list: [], data: {} },
  signers: {},
  tray: {
    open: false
  },
  signer: {
    minimized: true,
    open: false,
    current: '',
    requests: {},
    view: 'default',
    accounts: [],
    showAccounts: false,
    position: {
      scrollTop: 0,
      initial: {
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        height: 5,
        index: 0
      }
    }
  },
  frame: {
    type: 'tray'
  },
  node: {
    provider: false
  },
  provider: {
    events: []
  },
  local: {
    launch: local('launch', false),
    success: local('success', false),
    accounts: local('accounts', {}),
    enableMainnet: local('enableMainnet', false),
    connection: {
      network: local('connection.network', '4'),
      options: ['1', '4'],
      status: 'loading',
      local: {
        on: local('connection.local.on', false),
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        settings: {
          '1': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          '4': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          }
        }
      },
      secondary: {
        settings: {
          '1': {
            current: local('local.connection.secondary.settings.1.current', 'infura'),
            options: {
              infura: 'infura',
              custom: local('connection.secondary.settings.1.options.custom', '')
            }
          },
          '4': {
            current: local('connection.secondary.settings.4.current', 'infura'),
            options: {
              infura: 'infuraRinkeby',
              custom: local('connection.secondary.settings.4.options.custom', '')
            }
          }
        },
        on: local('connection.secondary.on', true),
        status: 'loading',
        connected: false,
        type: '',
        network: ''
      }
    }
  },
  extenal: {
    rates: {}
  }
}

module.exports = () => initial
