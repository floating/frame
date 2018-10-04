/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'
import utils from 'web3-utils'

import link from '../link'
import * as actions from './actions'

export const store = Restore.create(window.__initialState, actions)
store.events = new EventEmitter()

link.rpc('getSigners', (err, signers) => {
  if (err) return store.signersError(err)
  store.updateSigners(signers)
})
link.rpc('launchStatus', (err, status) => {
  if (err) return console.log(err) // launchStatusError
  store.setLaunch(status)
})

link.on('action', (action, ...args) => { if (store[action]) store[action](...args) })
link.send('tray:api') // turn on api

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
    link.send('tray:setNetwork', network)
  }
})

store.observer(_ => link.send('tray:persistLocal', store('local')))
store.observer(() => link.send('tray:setSync', 'local', store('local')))
store.observer(() => link.send('tray:setSync', 'signer', store('signer')))

let launch = store('local.launch')
store.observer(() => {
  if (launch !== store('local.launch')) {
    launch = store('local.launch')
    if (launch) {
      link.rpc('launchEnable', err => console.log(err))
    } else {
      link.rpc('launchDisable', err => console.log(err))
    }
  }
})

link.rpc('connectionStatus', (err, connection) => {
  if (err) return
  store.setLocal(connection.local)
  store.setSecondary(connection.secondary)
})

let monitor

const refreshBalances = () => {
  monitor.forEach(account => {
    link.rpc('providerSend', { 'jsonrpc': '2.0', 'method': 'eth_getBalance', 'params': [account, 'latest'], 'id': 1 }, res => {
      if (res.error) return
      store.setBalance(account, utils.fromWei(utils.hexToNumberString(res.result)))
    })
  })
}

store.observer(() => {
  monitor = []
  Object.keys(store('signers')).forEach(id => {
    if (store('signer.current') === id && store('signer.showAccounts')) { // When viewing accounts, refresh them all
      let accounts = store('signers', id, 'accounts')
      if (accounts.length) monitor = monitor.concat(accounts)
    } else { // Monitor index accounts of each signer
      let account = store('signers', id, 'accounts', store('signers', id, 'index'))
      if (account) monitor.push(account)
    }
  })
  refreshBalances()
})

setInterval(refreshBalances, 15 * 1000)

export default store
