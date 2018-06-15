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
ipcRenderer.on('main:removeSigner', (e, signer) => {
  if (store('signer.current') === signer.id) store.unsetSigner()
  store.removeSigner(signer)
})
ipcRenderer.on('main:updateSigner', (e, signer) => store.updateSigner(signer))
ipcRenderer.on('main:setSigner', (e, signer) => {
  if (signer.id) {
    store.setSigner(signer)
  } else {
    store.unsetSigner()
  }
})

// Replace events with observers
store.events.on('approveRequest', (id, req) => {
  store.requestPending(id)
  provider.approveRequest(req, (err, res) => {
    if (err) return store.requestError(id, err)
    store.requestSuccess(id, res)
  })
})

store.events.on('declineRequest', (id, req) => {
  store.declineRequest(id)
  provider.declineRequest(req)
})

// Store Observers
store.observer(() => {
  if (store('panel.show')) {
    document.body.className += ' panel'
  } else {
    document.body.className = document.body.className.replace(' panel', '')
  }
})

store.observer(_ => persist.set('local', store('local')))

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

module.exports = store
