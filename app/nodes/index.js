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
  getNetwork (provider, cb) { provider.sendAsync({jsonrpc: '2.0', method: 'net_version', params: [], id: 1}, cb) }
  getNodeType (provider, cb) { provider.sendAsync({jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1}, cb) }
  connect (connection) {
    if (connection.local.on) {
      if (!this.local) {
        if (connection.local.status !== 'loading') store.setLocal({status: 'loading', connected: false, type: ''})
        this.local = provider('direct', {name: 'local'})
        this.local.on('connect', details => {
          this.getNetwork(this.local, (netErr, netResponse) => {
            this.getNodeType(this.local, (typeErr, typeResponse) => {
              this.local.network = !netErr && netResponse && !netResponse.error ? netResponse.result : ''
              this.local.type = !typeErr && typeResponse && !typeResponse.error ? typeResponse.result : ''
              this.emit('connect')
              store.setLocal({status: this.local.status, connected: true, type: this.local.type, network: this.local.network})
            })
          })
        })
        this.local.on('close', details => {
          this.emit('close')
          store.setLocal({status: this.local.status, connected: false, type: ''})
        })
        this.local.on('status', status => {
          let current = store('local.connection.local.status')
          if ((current === 'loading' || current === 'not found') && status === 'disconnected') status = 'not found'
          store.setLocal({status})
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
        let target = store('local.connection.secondary.options', store('local.connection.network'), store('local.connection.secondary.current'))
        if (!this.secondary || this.secondary.currentTarget !== target) {
          if (this.secondary) this.secondary.close()
          if (connection.secondary.status !== 'loading') store.setSecondary({status: 'loading', connected: false, type: ''})
          this.secondary = provider(target, {name: 'secondary'})
          this.secondary.currentTarget = target
          this.secondary.on('connect', () => {
            this.getNetwork(this.secondary, (err, response) => {
              this.secondary.network = !err && response && !response.error ? response.result : '?'
              this.emit('connect')
              store.setSecondary({status: this.secondary.status, connected: true, type: '', network: this.secondary.network})
            })
          })
          this.secondary.on('close', () => {
            this.emit('close')
            store.setSecondary({status: this.secondary.status, connected: false, type: ''})
          })
          this.secondary.on('status', status => store.setSecondary({status}))
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
    if (this.local && this.local.connected && this.local.network === store('local.connection.network')) {
      this.local.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary && this.secondary.connected && this.secondary.network === store('local.connection.network')) {
      this.secondary.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else {
      this.resError('Not connected to valid Ethereum connection', payload, res)
    }
  }
}

export default new Nodes()
