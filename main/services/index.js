const geth = require('./Geth')
const parity = require('./Parity')
const ipfs = require('./Ipfs')
const store = require('../store')
const { app } = require('electron')

// Geth
app.on('ready', () => {
  // On geth toggle
  let on = null
  store.observer(_ => {
    // If client toggled ->
    if (on !== store('main.clients.geth.on')) {
      on = store('main.clients.geth.on')
      on ? geth.start() : geth.stop()
    }
  })

  // On switched network
  let network = store('main.connection.network')
  store.observer(_ => {
    // If new network and client is running ->
    if (network !== store('main.connection.network') && store('main.clients.geth.on')) {
      // If local connection on -> toggle it off
      if (store('main.connection.local.on')) store.toggleConnection('local')

      // Restart client (with updated network args)
      setTimeout(() => {
        store.toggleClient('geth')
        geth.once('exit', () => store.toggleClient('geth'))
      }, 500)

      // Update holder variable
      network = store('main.connection.network')
    }
  })

  // Link geth state with local connection
  let state = store('main.clients.geth.state')
  store.observer(_ => {
    let newState = store('main.clients.geth.state')
    let localOn = store('main.connection.local.on')
    if (state !== newState) {
      if (newState === 'ready' && !localOn) store.toggleConnection('local')
      if (newState === 'off' && localOn) setTimeout(() => store.toggleConnection('local'), 500)
      state = newState
    }
  })
})

// Parity
app.on('ready', () => {
  let on = null
  store.observer(_ => {
    // If client toggled ->
    if (on !== store('main.clients.parity.on')) {
      on = store('main.clients.parity.on')
      on ? parity.start() : parity.stop()
    }
  })

  // Link parity state with local connection
  let state = store('main.clients.parity.state')
  store.observer(_ => {
    let newState = store('main.clients.parity.state')
    let localOn = store('main.connection.local.on')
    if (state !== newState) {
      if (newState === 'ready' && !localOn) store.toggleConnection('local')
      if (newState === 'off' && localOn) setTimeout(() => store.toggleConnection('local'), 500)
      state = newState
    }
  })
})

// IPFS
app.on('ready', () => {
  let on = null
  store.observer(_ => {
    if (on !== store('main.clients.ipfs.on')) {
      on = store('main.clients.ipfs.on')
      on ? ipfs.start() : ipfs.stop()
    }
  })
})

module.exports = {
  stop: () => {
    geth.stop()
    ipfs.stop()
    parity.stop()
  }
}
