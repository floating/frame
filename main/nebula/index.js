const nebula = require('nebula')
const store = require('../store')
const accounts = require('../accounts')
const signers = require('../signers')
const _ = require('lodash')
console.log(_)

// TODO: Replace with client that ipfs module exposes on the 'dapp-launcher' branch
const ipfs = require('../clients/Ipfs')
const EventEmitter = require('events')

class Nebula extends EventEmitter {
  constructor () {
    super()
    this.address = null
    this.identity = null
    this.n = null
    this.observer = null

    // Detect selected account
    store.observer(_ => {
      // Get id
      const id = store('selected.current')

      // If no account selected -> do nothing
      if (!ipfs.api) return console.log('ipfs not running')
      if (!id) return console.log('no id')

      // If observer already set -> remove old observer
      if (this.observer) console.log('removing observer', this.observer.remove())

      // Observer changes to address index
      this.observer = store.observer(async () => {

        // Get relevant account and signer data
        const account = store(`main.accounts.${id}`)
        const address = account.addresses[account.index]
        const signer = signers.get(account.signer.id)

        // Make sure signer is unlocked -> else abort
        if (signer.status !== 'ok') return

        // Get orbits
        const orbits = store(`main.nebula.orbits.${address}`) || []

        // Create nebula instance
        console.log('ORBITS', orbits)
        const config = { address, sign: this._signingFunction(signer, account.index), ipfs: ipfs.api, orbits }
        this.n = await nebula(config)

        // Set identity
        this.address = address
        this.identity = await this.n.identity()

        // Set event listener
        // TODO: Reset on new account selected
        this.n.on('particle', (data) => this.emit('data', data))

        // Emit ready
        this.emit('ready')
      })
    })
  }

  async createOrbit (peer) {
    try {
      const orbit = await this.n.createOrbit(peer)
      store.addOrbit(this.address, orbit)
    } catch (err) {
      console.error(err)
    }
  }

  _signingFunction (signer, index) {
    return (payload) => {
      return new Promise((resolve, reject) => {
        signer.signMessage(index, payload, (err, result) => {
          console.log(err, result)
          if (err) return reject(err)
          resolve(result)
        })
      })
    }
  }

  async init () {
    console.log(accounts.current())
  }
}

module.exports = Nebula

// DEBUG
const n = new Nebula()
const peer = '0xA536C22c8aF29aA412cC155455606B31bDDb1d4c'
n.once('ready', async () => {
  console.log('Nebula ready:', n.identity)
  await n.createOrbit(peer)
})
n.on('data', (data) => {
  console.log('Nebula received:', data)
})

// setInterval(async () => {
//   n.init()
// }, 1000)
