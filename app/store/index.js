import { ipcRenderer } from 'electron'

import EventEmitter from 'events'
import Restore from 'react-restore'

import * as actions from './actions'
import state from './state'

import rpc from '../rpc'
import provider from '../provider'

const store = Restore.create(state(), actions)
store.events = new EventEmitter()

rpc('getSigners', (err, signers) => {
  if (err) return store.signersError(err)
  store.updateSigners(signers)
})

ipcRenderer.on('main:addSigner', (e, signer) => store.addSigner(signer))
ipcRenderer.on('main:removeSigner', (e, signer) => store.removeSigner(signer))
ipcRenderer.on('main:updateSigner', (e, signer) => store.updateSigner(signer))
ipcRenderer.on('main:supplyPassword', (e, id) => store.supplyPassword(id))
ipcRenderer.on('main:requestError', (e, id, text) => {
  id = JSON.parse(id)
  text = JSON.parse(text)
  store.requestError(id, {message: text})
})
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

module.exports = store
