const Restore = require('react-restore')
const PersistStore = require('electron-store') // Should live on IPFS
const persist = new PersistStore()
const actions = require('./actions')

const state = {
  user: {signer: {connected: false}},
  permissions: persist.get('permissions') || {},
  network: ''
}

const store = Restore.create(state, actions)
store.observer(_ => persist.set('permissions', store('permissions')))

module.exports = store
