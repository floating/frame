// status = Network Mismatch, Not Connected, Connected, Standby, Syncing

import store from '../store'
import provider from 'eth-provider'

class Nodes {
  constructor () {
    this.observer = store.observer(() => this.connect(store('local.connection')))
    this.local = null
    this.secondary = null
  }
  connect (connection) {
    if (connection.local.on) {
      if (!this.local) {
        this.local = provider('direct', {name: 'local'})
        this.local.on('open', details => {
          store.setLocal({status: 'connected', connected: true, type: ''})
          console.log('local provider open')
        })
        this.local.on('close', details => {
          store.setLocal({status: 'disconnected', connected: false, type: ''})
          console.log('local provider close')
        })
      }
    } else {
      if (this.local) this.local.destroy()
      this.local = null
    }
    if (connection.secondary.on) {
      if (!connection.local.on || connection.local.status === 'disconnected') {
        if (!this.secondary) {
          if (connection.secondary.status !== 'loading') store.setSecondary({status: 'loading', connected: false, type: ''})
          // emit notificaion when switching to sedondary
          this.secondary = provider('rinkeby_infura', {name: 'secondary'})
          this.secondary.on('open', () => {
            store.setSecondary({status: 'connected', connected: true, type: ''})
          })
          this.secondary.on('close', () => {
            store.setSecondary({status: 'disconnected', connected: false, type: ''})
          })
        }
      } else {
        if (this.secondary) this.secondary.destroy()
        this.secondary = null
        if (connection.secondary.status !== 'standby') store.setSecondary({status: 'standby', connected: false, type: ''})
      }
    }
  }
  send (payload, cb) {
    if (this.local.connected) {
      this.local.send(payload, cb)
    } else if (this.secondary.connected) {
      this.secondary.send(payload, cb)
    } else {
      cb(new Error('Not connected to any node'))
    }
  }
}

export default new Nodes()
