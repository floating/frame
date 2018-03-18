import uuid from 'uuid/v4'

const PersistStore = require('electron-store') // Stored remotely in future on IPFS or something
const persist = new PersistStore()

let initial = {
  panel: {
    show: false,
    view: 'home'
  },
  view: {current: '', list: [], data: {}},
  permissions: persist.get('permissions') || {},
  signers: [],
  signer: {
    minimized: false,
    current: '',
    requests: {}
  },
  frame: {
    type: process.env.FRAME_TYPE || 'window'
  },
  provider: {
    events: []
  }
}

if (initial.view.list.length === 0) {
  let id = uuid()
  initial.view.current = id
  initial.view.list = [id]
  initial.view.data[id] = {url: 'http://localhost:1234', title: ''}
}

export default () => initial
