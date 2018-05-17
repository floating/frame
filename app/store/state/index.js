import uuid from 'uuid/v4'

const PersistStore = require('electron-store') // Stored remotely in future on IPFS or something
const persist = new PersistStore()
persist.clear()

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
    type: process.env.FRAME_TYPE || 'window'
  },
  node: {
    provider: false
  },
  provider: {
    events: []
  },
  local: persist.get('local') || {
    launch: false,
    node: {
      run: false,
      default: 'wss://rinkeby.infura.io/ws'
    },
    accounts: {}
  }
}

if (initial.frame.type !== 'tray' && initial.view.list.length === 0) {
  let id = uuid()
  initial.view.current = id
  initial.view.list = [id]
  initial.view.data[id] = {url: 'http://localhost:1234', title: ''}
}

export default () => initial
