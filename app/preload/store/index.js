/* globals fetch */

import { ipcRenderer } from 'electron'

import EventEmitter from 'events'
import Restore from 'react-restore'

import * as actions from './actions'
import state from './state'

import rpc from '../rpc'

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

const etherRates = () => {
  fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH').then(res => res.json()).then(res => {
    if (res && res.data && res.data.rates) store.updateExternalRates(res.data.rates)
  }).catch(e => console.log('Unable to fetch exchange rate', e))
}
etherRates()
setInterval(etherRates, 10000)

// Store Observers
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

export default store
