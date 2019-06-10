const windows = require('../windows')
const geth = require('./Geth')
const parity = require('./Parity')
const ipfs = require('./Ipfs')
const store = require('../store')
const { app } = require('electron')

// Parity
app.on('ready', () => {
  let previousOn = false
  store.observer(_ => {
    // On client toggled ->
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
  store.observer(_ => {
    let state = store('main.clients.parity.state')
    console.log("Observed state", state)
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