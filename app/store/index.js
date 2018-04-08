import { ipcRenderer } from 'electron'

import EventEmitter from 'events'
import Restore from 'react-restore'

import * as actions from './actions'
import state from './state'

import rpc from '../rpc'
import provider from '../provider'

const PersistStore = require('electron-store') // Stored remotely in future on IPFS or something
const persist = new PersistStore()

const store = Restore.create(state(), actions)
store.events = new EventEmitter()

rpc('getSigners', (err, signers) => {
  if (err) return store.signersError(err)
  store.updateSigners(signers)
})

rpc('launchStatus', (err, status) => {
  if (err) return console.log(err) // launchStatusError
  store.setLaunch(status)
})

ipcRenderer.on('main:addSigner', (e, signer) => store.addSigner(signer))
ipcRenderer.on('main:removeSigner', (e, signer) => store.removeSigner(signer))
ipcRenderer.on('main:updateSigner', (e, signer) => store.updateSigner(signer))
ipcRenderer.on('main:setSigner', (e, signer) => store.setSigner(signer))

// Replace events with observers
store.events.on('approveRequest', (id, req) => {
  store.requestPending(id)
  provider.approveRequest(req, (err, res) => {
    if (err) return store.requestError(id, err)
    store.requestSuccess(id, res)
  })
})

// Store Observers
store.observer(() => {
  if (store('panel.show')) {
    document.body.className += ' panel'
  } else {
    document.body.className = document.body.className.replace(' panel', '')
  }
})

// store.observer(_ => persist.set('permissions', store('permissions')))
store.observer(_ => persist.set('accounts', store('local.accounts')))

let launch = store('local.launch')
store.observer(() => {
  if (launch !== store('local.launch')) {
    launch = store('local.launch')
    if (launch) {
      rpc('launchEnable', err => console.log(err))
    } else {
      rpc('launchDisable', err => console.log(err))
    }
  }
})

store.observer(() => {
  let ws = require('../ws')
  let permissions = store('permissions')
  Object.keys(permissions).forEach(id => {
    if (permissions[id].provider === false) if (ws.close) ws.close(permissions[id].origin)
  })
})

module.exports = store
