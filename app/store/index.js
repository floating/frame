/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'
import utils from 'web3-utils'

import link from '../../resources/link'
import * as actions from './actions'

export default (state, cb) => {
  const store = Restore.create(state, actions)
  store.events = new EventEmitter()

  // Feed for relaying state updates
  store.api.feed((state, actions, obscount) => {
    actions.forEach(action => {
      action.updates.forEach(update => {
        console.log(update)
        if (update.path.startsWith('main')) return
        if (update.path.startsWith('panel')) return
        // link.send('tray:syncPath', update.path, update.value)
      })
    })
  })

  link.on('action', (action, ...args) => { if (store[action]) store[action](...args) })
  link.send('tray:ready') // turn on api

  const etherRates = () => {
    fetch('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=KU5RZ9156Q51F592A93RUKHW1HDBBUPX9W').then(res => res.json()).then(res => {
      if (res && res.message === 'OK' && res.result && res.result.ethusd) {
        store.updateExternalRates({ USD: res.result.ethusd })
      }
    }).catch(e => console.log('Unable to fetch exchange rate', e))
  }
  etherRates()
  setInterval(etherRates, 10000)

  link.send('tray:refreshMain')

  let monitor

  const refreshBalances = () => {
    monitor.forEach(address => {
      link.rpc('providerSend', { jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }, res => {
        if (res.error) return
        const balance = utils.fromWei(utils.hexToNumberString(res.result))
        if (store('balances', address) !== balance) store.setBalance(address, balance)
      })
    })
  }

  store.observer(() => {
    monitor = []
    if (store('selected.current')) {
      const account = store('main.accounts', store('selected.current'))
      if (account) {
        if (store('selected.showAccounts')) { // When viewing accounts, refresh them all
          const startIndex = store('selected.accountPage') * 5
          if (account.addresses.length) monitor = account.addresses.slice(startIndex, startIndex + 10)
        } else {
          monitor = [account.addresses[account.index]]
        }
      } else {
        const accounts = store('main.accounts')
        monitor = Object.keys(accounts).map(id => {
          const account = accounts[id]
          return account.addresses[account.index]
        })
      }
    }
    refreshBalances()
  })

  setInterval(refreshBalances, 15 * 1000)

  return store
}
