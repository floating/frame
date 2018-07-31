import uuid from 'uuid/v4'

const PersistStore = require('electron-store') // Stored remotely in future on IPFS or something
const persist = new PersistStore()
let persistLocal = persist.get('local')

let initial = {
  panel: {
    show: false,
    view: 'default'
  },
  view: {current: '', list: [], data: {}},
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
  enableMainnet: false,
  local: {
    launch: persistLocal ? persistLocal.launch : false,
    success: persistLocal ? persistLocal.success : false,
    accounts: persistLocal ? persistLocal.accounts : {},
    connection: {
      network: '4',
      options: ['1', '4'],
      status: 'loading',
      local: {
        on: persistLocal ? persistLocal.connection.local.on : true,
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
            current: persistLocal ? persistLocal.connection.secondary.settings['1'].current : 'infura',
            options: {
              infura: 'infura',
              custom: persistLocal ? persistLocal.connection.secondary.settings['1'].options.custom : ''
            }
          },
          '4': {
            current: persistLocal ? persistLocal.connection.secondary.settings['4'].current : 'infura',
            options: {
              infura: 'infuraRinkeby',
              custom: persistLocal ? persistLocal.connection.secondary.settings['4'].options.custom : ''
            }
          }
        },
        on: persistLocal ? persistLocal.connection.secondary.on : true,
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

if (initial.frame.type !== 'tray' && initial.view.list.length === 0) {
  let id = uuid()
  initial.view.current = id
  initial.view.list = [id]
  initial.view.data[id] = {url: 'http://localhost:1234', title: ''}
}

export default () => initial
