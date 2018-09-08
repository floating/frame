/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'

import iso from '../iso'
import * as actions from './actions'

export const store = Restore.create(window.frameState, actions)
store.events = new EventEmitter()

iso.rpc('getSigners', (err, signers) => {
  if (err) return store.signersError(err)
  store.updateSigners(signers)
})
iso.rpc('launchStatus', (err, status) => {
  if (err) return console.log(err) // launchStatusError
  store.setLaunch(status)
})

iso.on('main:addSigner', (signer) => store.addSigner(signer))
iso.on('main:removeSigner', (signer) => {
  if (store('signer.current') === signer.id) store.unsetSigner()
  store.removeSigner(signer)
})
iso.on('main:updateSigner', (signer) => store.updateSigner(signer))
iso.on('main:setSigner', (signer) => {
  if (signer.id) {
    store.setSigner(signer)
  } else {
    store.unsetSigner()
  }
})

iso.on('action', (action, ...args) => {
  if (store[action]) store[action](...args)
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
    iso.send('tray:setNetwork', network)
  }
})

store.observer(_ => iso.send('tray:persistLocal', store('local')))
store.observer(() => iso.sync('local', store('local')))
store.observer(() => iso.sync('signer', store('signer')))

let launch = store('local.launch')
store.observer(() => {
  if (launch !== store('local.launch')) {
    launch = store('local.launch')
    if (launch) {
      iso.rpc('launchEnable', err => console.log(err))
    } else {
      iso.rpc('launchDisable', err => console.log(err))
    }
  }
})

export default store
