const windows = require('../windows')
const geth = require('./Geth')
const parity = require('./Parity')
const ipfs = require('./Ipfs')
const store = require('../store')
const { app } = require('electron')

// Parity
app.on('ready', () => {
  let on = false
  store.observer(_ => {
    // On client toggled ->
    if (on !== store('main.clients.parity.on')) {
      on = store('main.clients.parity.on')
      on ? parity.start() : parity.stop()
    }
  })

  // On network switched
  let previousNetworkId = store('main.connection.network')
  store.observer(_ => {
    const networkId = store('main.connection.network')

    // If new network and client is running ->
    if (networkId !== previousNetworkId && store('main.clients.parity.on')) {
      // Restart client with updated network args (unless network swwitched to Rinkeby)
      store.toggleClient('parity', false)

      if (networkId === '4') {
        windows.broadcast('main:action', 'notify', 'rinkeby')
      } else {
        parity.once('exit', () => {
          if (networkId !== '4') store.toggleClient('parity', true)
        })
      }

      // Update holder variable
      previousNetworkId = store('main.connection.network')
    }
  })

  // Link parity on/off with local connection
  let state = store('main.clients.parity.state')
  store.observer(_ => {
    let newState = store('main.clients.parity.state')
    let localOn = store('main.connection.local.on')
    if (state !== newState) {
      if (newState === 'ready' && !localOn) store.toggleConnection('local')
      if (newState === 'off' && localOn) store.toggleConnection('local')
      state = newState
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
