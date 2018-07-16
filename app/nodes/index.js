// status = Network Mismatch, Not Connected, Connected, Standby, Syncing

import EventEmitter from 'events'
import provider from 'eth-provider'

import store from '../store'

class Nodes extends EventEmitter {
  constructor () {
    super()
    this.local = null
    this.secondary = null
    this.observer = store.observer(() => this.connect(store('local.connection')))
  }
  connect (connection) {
    if (connection.local.on) {
      if (!this.local) {
        if (connection.local.status !== 'loading') store.setLocal({status: 'loading', connected: false, type: ''})
        this.local = provider('rinkeby_infura', {name: 'local'})
        this.local.on('connect', details => {
          this.emit('connect')
          store.setLocal({status: 'connected', connected: true, type: ''})
        })
        this.local.on('close', details => {
          this.emit('close')
          store.setLocal({status: 'disconnected', connected: false, type: ''})
        })
      }
    } else {
      if (this.local) this.local.destroy()
      this.local = null
      if (connection.local.status !== 'off') store.setLocal({status: 'off', connected: false, type: ''})
    }
    if (connection.secondary.on) {
      if (!connection.local.on || connection.local.status === 'disconnected') {
        if (!this.secondary) {
          if (connection.secondary.status !== 'loading') store.setSecondary({status: 'loading', connected: false, type: ''})
          this.secondary = provider('rinkeby_infura', {name: 'secondary'})
          this.secondary.on('connect', () => {
            this.emit('connect')
            store.setSecondary({status: 'connected', connected: true, type: ''})
          })
          this.secondary.on('close', () => {
            this.emit('close')
            store.setSecondary({status: 'disconnected', connected: false, type: ''})
          })
        }
      } else {
        if (this.secondary) this.secondary.destroy()
        this.secondary = null
        if (connection.secondary.status !== 'standby') store.setSecondary({status: 'standby', connected: false, type: ''})
      }
    } else {
      if (this.secondary) this.secondary.destroy()
      this.secondary = null
      if (connection.secondary.status !== 'off') store.setSecondary({status: 'off', connected: false, type: ''})
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
