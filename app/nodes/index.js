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
        this.local = provider('direct', {name: 'local'})
        this.local.on('connect', details => {
          this.emit('connect')
          store.setLocal({status: this.local.status, connected: true, type: ''})
        })
        this.local.on('close', details => {
          this.emit('close')
          store.setLocal({status: this.local.status, connected: false, type: ''})
        })
        this.local.on('data', data => this.emit('data', data))
        this.local.on('error', err => this.emit('error', err))
      }
    } else {
      if (this.local) this.local.close()
      this.local = null
      if (connection.local.status !== 'off') store.setLocal({status: 'off', connected: false, type: ''})
    }
    if (connection.secondary.on) {
      if (!connection.local.on || (connection.local.status !== 'connected' && connection.local.status !== 'loading')) {
        if (!this.secondary) {
          if (connection.secondary.status !== 'loading') store.setSecondary({status: 'loading', connected: false, type: ''})
          this.secondary = provider('infuraRinkeby', {name: 'secondary'})
          this.secondary.on('connect', () => {
            this.emit('connect')
            store.setSecondary({status: this.secondary.status, connected: true, type: ''})
          })
          this.secondary.on('close', () => {
            this.emit('close')
            store.setSecondary({status: this.secondary.status, connected: false, type: ''})
          })
          this.secondary.on('data', data => this.emit('data', data))
          this.secondary.on('error', err => this.emit('error', err))
        }
      } else {
        if (this.secondary) this.secondary.close()
        this.secondary = null
        if (connection.secondary.status !== 'standby') store.setSecondary({status: 'standby', connected: false, type: ''})
      }
    } else {
      if (this.secondary) this.secondary.close()
      this.secondary = null
      if (connection.secondary.status !== 'off') store.setSecondary({status: 'off', connected: false, type: ''})
    }
  }
  resError (error, payload, res) {
    if (typeof error === 'string') error = {message: error, code: -1}
    res({id: payload.id, jsonrpc: payload.jsonrpc, error})
  }
  send (payload, res) {
    if (this.local && this.local.connected) {
      this.local.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary && this.secondary.connected) {
      this.secondary.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else {
      this.resError('Not connected to the Ethereum', payload, res)
    }
  }
}

export default new Nodes()
