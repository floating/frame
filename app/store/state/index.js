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
  permissions: persist.get('permissions') || {},
  signers: [],
  signer: {
    minimized: false,
    current: '',
    requests: {},
    view: 'default'
  },
  frame: {
    type: process.env.FRAME_TYPE || 'window'
  },
  provider: {
    events: []
  },
  local: {
    startup: false,
    node: {
      run: false,
      backup: 'http://rinkby.infura.com'
    }
  }
}

if (initial.view.list.length === 0) {
  let id = uuid()
  initial.view.current = id
  initial.view.list = [id]
  initial.view.data[id] = {url: 'http://localhost:1234', title: ''}
}

export default () => initial
