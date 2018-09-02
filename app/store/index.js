/* globals fetch */

import { ipcRenderer } from 'electron'

import EventEmitter from 'events'
import Restore from 'react-restore'

import * as actions from './actions'
import state from './state'

import rpc from '../rpc'
import provider from '../provider'

import log from 'electron-log'
import PersistStore from 'electron-store'

const persist = new PersistStore()

export const store = Restore.create(state(), actions)
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

const etherRates = () => {
  fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH').then(res => res.json()).then(res => {
    if (res && res.data && res.data.rates) store.updateExternalRates(res.data.rates)
  }).catch(e => console.log('Unable to fetch exchange rate', e))
}
etherRates()
setInterval(etherRates, 10000)

// Store Observers
store.observer(() => {
  if (store('panel.show')) {
    document.body.className += ' panel'
  } else {
    document.body.className = document.body.className.replace(' panel', '')
  }
})

let network = ''
store.observer(() => {
  if (network !== store('local.connection.network')) {
    network = store('local.connection.network')
    ipcRenderer.send('tray:setNetwork', network)
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

let node
store.observer(() => {
  if (node !== store('local.node.on')) {
    node = store('local.node.on')
    rpc('servicesUpdate', 'node', node, err => log.error(err))
  }
})

let ipfs
store.observer(() => {
  if (ipfs !== store('local.ipfs.on')) {
    ipfs = store('local.ipfs.on')
    rpc('servicesUpdate', 'ipfs', ipfs, err => log.error(err))
  }
})

export default store
