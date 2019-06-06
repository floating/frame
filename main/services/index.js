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
      console.log('Toggling parity', on)
      on ? parity.start() : parity.stop()
    }
  })

  // On network switched
  let previousNetworkId = store('main.connection.network')
  store.observer(_ => {
    // If new network and client is running ->
    const networkId = store('main.connection.network')
    if (networkId !== previousNetworkId && store('main.clients.parity.on')) {
      // If local connection on -> toggle it off
      if (store('main.connection.local.on')) store.toggleConnection('local')

      // Restart client with updated network args (unless network swwitched to Rinkeby)
      setTimeout(() => {
        store.toggleClient('parity')
        geth.once('exit', () => {
          if (networkId !== '4') store.toggleClient('parity')
        })
      }, 500)

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
