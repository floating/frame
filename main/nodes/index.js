// status = Network Mismatch, Not Connected, Connected, Standby, Syncing

const EventEmitter = require('events')
const provider = require('eth-provider')
const log = require('electron-log')

const store = require('../store')

class Nodes extends EventEmitter {
  constructor () {
    super()
    this.primary = {
      status: 'off',
      network: '',
      type: '',
      connected: false
    }
    this.secondary = {
      status: 'off',
      network: '',
      type: '',
      connected: false
    }
    this.observer = store.observer(() => {
      const { type, id } = store('main.currentNetwork')
      this.connect(store('main.networks', type, id, 'connection'))
    })
  }

  update (priority) {
    const currentNetwork = store('main.currentNetwork')
    if (priority === 'primary') {
      const { status, connected, type, network } = this.primary
      const details = { status, connected, type, network }
      log.info('    Updating primary connection to status, ', details)
      store.setPrimary(currentNetwork.type, currentNetwork.id, details)
    } else if (priority === 'secondary') {
      const { status, connected, type, network } = this.secondary
      const details = { status, connected, type, network }
      log.info('    Updating secondary connection to status, ', details)
      store.setSecondary(currentNetwork.type, currentNetwork.id, details)
    }
  }

  getNetwork (provider, cb) { provider.sendAsync({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }, cb) }

  getNodeType (provider, cb) { provider.sendAsync({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }, cb) }

  connect (connection) {
    log.info(' ')
    log.info('Connection has been updated')
    if (this.network !== connection.network) {
      if (this.primary.provider) this.primary.provider.close()
      if (this.secondary.provider) this.secondary.provider.close()
      this.primary = { status: 'loading', network: '', type: '', connected: false }
      this.secondary = { status: 'loading', network: '', type: '', connected: false }
      this.update('primary')
      this.update('secondary')
      log.info('    Network changed from ' + this.network + ' to ' + connection.network)
      this.network = connection.network
    }

    // Secondary connection is on
    if (connection.secondary.on) {
      log.info('    Secondary connection: ON')
      if (connection.primary.on && connection.primary.status === 'connected') {
        // Connection is on Standby
        log.info('    Secondary connection on STANDBY', connection.secondary.status === 'standby')
        if (this.secondary.provider) this.secondary.provider.close()
        this.secondary.provider = null
        if (connection.secondary.status !== 'standby') {
          this.secondary.connected = false
          this.secondary.type = ''
          this.secondary.status = 'standby'
          this.update('secondary')
        }
      } else {
        const { type, id } = store('main.currentNetwork')
        const connection = store('main.networks', type, id, 'connection')
        const { secondary } = connection
        const presets = store('main.networkPresets', type)
        const currentPresets = Object.assign({}, presets.default, presets[id])
        const target = secondary.current === 'custom' ? secondary.custom : currentPresets[secondary.current]
        if (!this.secondary.provider || this.secondary.currentSecondaryTarget !== target) {
          log.info('    Creating secondary connection becasue it didn\'t exist or the target changed')
          if (this.secondary.provider) this.secondary.provider.close()
          this.secondary.provider = null
          this.secondary.currentSecondaryTarget = target
          this.secondary.status = 'loading'
          this.secondary.connected = false
          this.secondary.type = ''
          this.update('secondary')
          this.secondary.provider = provider(target, { name: 'secondary', infuraId: '786ade30f36244469480aa5c2bf0743b' })
          this.secondary.provider.on('connect', () => {
            log.info('    Secondary connection connected')
            this.getNetwork(this.secondary.provider, (err, response) => {
              this.secondary.network = !err && response && !response.error ? response.result : ''
              if (this.secondary.network && this.secondary.network !== store('main.currentNetwork.id')) {
                this.secondary.connected = false
                this.secondary.type = ''
                this.secondary.status = 'network mismatch'
                this.update('secondary')
              } else {
                this.secondary.status = 'connected'
                this.secondary.connected = true
                this.secondary.type = ''
                this.update('secondary')
                this.emit('connect')
              }
            })
          })
          this.secondary.provider.on('close', () => {
            log.info('    Secondary connection close')
            this.secondary.connected = false
            this.secondary.type = ''
            this.secondary.network = ''
            this.update('secondary')
            this.emit('close')
          })
          this.secondary.provider.on('status', status => {
            if (status === 'connected' && this.secondary.network && this.secondary.network !== store('main.currentNetwork.id')) {
              this.secondary.connected = false
              this.secondary.type = ''
              this.secondary.status = 'network mismatch'
              this.update('secondary')
            } else {
              this.primary.status = status
              this.update('secondary')
            }
          })
          this.secondary.provider.on('data', data => this.emit('data', data))
          this.secondary.provider.on('error', err => this.emit('error', err))
        }
      }
    // Secondary connection is set to OFF by the user
    } else {
      log.info('    Secondary connection: OFF')
      if (this.secondary.provider) this.secondary.provider.close()
      this.secondary.provider = null
      if (this.secondary.status !== 'off') {
        this.secondary.status = 'off'
        this.secondary.connected = false
        this.secondary.type = ''
        this.secondary.network = ''
        this.update('secondary')
      }
    }

    if (connection.primary.on) {
      log.info('    Primary connection: ON')
      const { type, id } = store('main.currentNetwork')
      const connection = store('main.networks', type, id, 'connection')
      const { primary } = connection
      const presets = store('main.networkPresets', type)
      const currentPresets = Object.assign({}, presets.default, presets[id])
      const target = primary.current === 'custom' ? primary.custom : currentPresets[primary.current]
      if (!this.primary.provider || this.primary.currentPrimaryTarget !== target) {
        log.info('    Creating primary connection becasue it didn\'t exist or the target changed')
        if (this.primary.provider) this.primary.provider.close()
        this.primary.provider = null
        this.primary.currentPrimaryTarget = target
        this.primary.status = 'loading'
        this.primary.connected = false
        this.primary.type = ''
        this.update('primary')
        this.primary.provider = provider(target, { name: 'primary', infuraId: '786ade30f36244469480aa5c2bf0743b' })
        this.primary.provider.on('connect', () => {
          log.info('    Primary connection connected')
          this.getNetwork(this.primary.provider, (err, response) => {
            this.primary.network = !err && response && !response.error ? response.result : ''
            if (this.primary.network && this.primary.network !== store('main.currentNetwork.id')) {
              this.primary.connected = false
              this.primary.type = ''
              this.primary.status = 'network mismatch'
              this.update('primary')
            } else {
              this.primary.status = 'connected'
              this.primary.connected = true
              this.primary.type = ''
              this.update('primary')
              this.emit('connect')
            }
          })
        })
        this.primary.provider.on('close', () => {
          log.info('    Primary connection close')
          this.primary.connected = false
          this.primary.type = ''
          this.primary.network = ''
          this.update('primary')
          this.emit('close')
        })
        this.primary.provider.on('status', status => {
          if (status === 'connected' && this.primary.network && this.primary.network !== store('main.currentNetwork.id')) {
            this.primary.connected = false
            this.primary.type = ''
            this.primary.status = 'network mismatch'
            this.update('primary')
          } else {
            this.primary.status = status
            this.update('primary')
          }
        })
        this.primary.provider.on('data', data => this.emit('data', data))
        this.primary.provider.on('error', err => this.emit('error', err))
      }
    } else {
      log.info('    Primary connection: OFF')
      if (this.primary.provider) this.primary.provider.close()
      this.primary.provider = null
      if (this.primary.status !== 'off') {
        this.primary.status = 'off'
        this.primary.connected = false
        this.primary.type = ''
        this.primary.network = ''
        this.update('primary')
      }
    }
  }

  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
  }

  send (payload, res) {
    if (this.primary.provider && this.primary.connected && this.primary.network === store('main.currentNetwork.id')) {
      this.primary.provider.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary.provider && this.secondary.connected && this.secondary.network === store('main.currentNetwork.id')) {
      this.secondary.provider.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else {
      this.resError('Not connected to Ethereum network', payload, res)
    }
  }
}

module.exports = new Nodes()
