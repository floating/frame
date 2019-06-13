const windows = require('../windows')
const geth = require('./Geth')
const parity = require('./Parity')
const ipfs = require('./Ipfs')
const store = require('../store')
const { app } = require('electron')

// Parity
app.on('ready', () => {

  // On client toggled ->
  let previousOn = false
  store.observer(_ => {
    let on = store('main.clients.parity.on')
    if (on !== previousOn) {
      on ? parity.start() : parity.stop()
      previousOn = on
    }
  })

  // On network switched
  let previousNetworkId = store('main.connection.network')
  store.observer(_ => {
    const networkId = store('main.connection.network')
    const on = store('main.clients.parity.on')
    const state = store('main.clients.parity.state')

    // If new network and client is running ->
    if (networkId !== previousNetworkId && on) {
      // Restart client with updated network args (unless network swwitched to Rinkeby)
      if (state === 'ready' || state === 'syncing') store.toggleClient('parity', false)
      
      if (networkId === '4') {
        windows.broadcast('main:action', 'notify', 'rinkeby')
      } else {
        parity.once('exit', () => {
          setTimeout(() => store.toggleClient('parity', true), 500)
        })
      }
      

      // Update holder variable
      previousNetworkId = store('main.connection.network')
    }
  })

  // Link parity on/off with local connection
  store.observer(_ => {
    let state = store('main.clients.parity.state')
    if (state === 'ready') store.toggleConnection('local', true)
    if (state === 'off') store.toggleConnection('local', false)
  })
})

// Ipfs
app.on('ready', () => {
  // On client toggled ->
  let on = false
  store.observer(_ => {
    if (on !== store('main.clients.ipfs.on')) {
      on = store('main.clients.ipfs.on')
      on ? ipfs.start() : ipfs.stop()
    }
  })
})

module.exports = {
  stop: async () => {
    return Promise.all([
      geth.stop(),
      ipfs.stop(),
      parity.stop()
    ])
  }
}