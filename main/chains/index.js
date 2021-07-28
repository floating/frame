// status = Network Mismatch, Not Connected, Connected, Standby, Syncing

const EventEmitter = require('events')
const provider = require('eth-provider')
const log = require('electron-log')

const store = require('../store')
const { default: BlockMonitor } = require('./blocks')
const { chainConfig } = require('./config')
const { default: GasCalculator } = require('../transaction/gasCalculator')

class ChainConnection extends EventEmitter {
  constructor (type, chainId) {
    super()
    this.type = type
    this.chainId = chainId

    this.chainConfig = chainConfig(parseInt(this.chainId))

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
      const chain = store('main.networks', type, chainId)
      if (chain) this.connect(chain)
    })
  }

  _createProvider (target, priority) {
    this.update(priority)

    this[priority].provider = provider(target, { name: priority, infuraId: '786ade30f36244469480aa5c2bf0743b' })

    if (this.chainId == 4 || this.chainId == 3 || this.chainId == 42) { // FIXME: temporary to prevent spam while testing
      this[priority].blockMonitor = this._createBlockMonitor(this[priority].provider, priority)
    }
  }

  _handleConnection (priority) {
    this.update(priority)
    this.emit('connect')
  }

  _createBlockMonitor (provider) {
    const monitor = new BlockMonitor(provider)

    monitor.on('data', block => {
      const gasCalculator = new GasCalculator(provider)

      // seems like there is a bug in hardforkIsActiveOnBlock(), it always returns true
      // if the hardfork block isn't defined for the chain
      const londonHardforkActive = 
        this.chainConfig.hardforkIsActiveOnChain('london') &&
        this.chainConfig.hardforkIsActiveOnBlock('london', block.number)

      if (londonHardforkActive) {
        gasCalculator.getFeePerGas().then(fees => {
          store.setGasFees(this.type, this.chainId, fees)
          store.setGasPrices(this.type, this.chainId, { standard: fees.maxFeePerGas })
          store.setGasDefault(this.type, this.chainId, 'standard')
        }).catch(err => {
          log.error(`could not update gas fees for chain ${this.chainId}`, err)
        })
      } else {
        if (this.chainId != 1) {
          // prior to the london hardfork, mainnet uses its own gas service
          gasCalculator.getGasPrices().then(gas => {
            const customLevel = store('main.networksMeta', this.network, this.chainId, 'gas.price.levels.custom')

            store.setGasPrices({
              ...gas,
              custom: customLevel || gas.standard
            })
          }).catch(err => {
            log.error(`could not update gas prices for chain ${this.chainId}`, err)
          })
        }
      }
    })
  }

  update (priority) {
    if (priority === 'primary') {
      const { status, connected, type, network } = this.primary
      const details = { status, connected, type, network }
      log.info('    Updating primary connection to status, ', details)
      store.setPrimary(this.type, this.chainId, details)
    } else if (priority === 'secondary') {
      const { status, connected, type, network } = this.secondary
      const details = { status, connected, type, network }
      log.info('    Updating secondary connection to status, ', details)
      store.setSecondary(this.type, this.chainId, details)
    }
  }

  getNetwork (provider, cb) {
    provider.sendAsync({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }, (err, response) => {
      try {
        response.result = !err && response && !response.error ? parseInt(response.result, 'hex').toString() : ''
        cb(err, response)
      } catch (e) {
        cb(e)
      }
    })
  }

  getNodeType (provider, cb) { provider.sendAsync({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }, cb) }

  connect (chain) {
    const connection = chain.connection
    log.info(' ')
    log.info(this.type + ':' + this.chainId + '\'s connection has been updated')
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
    if (chain.on && connection.secondary.on) {
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
        const connection = store('main.networks', this.type, this.chainId, 'connection')
        const { secondary } = connection
        const presets = store('main.networkPresets', this.type)
        const currentPresets = Object.assign({}, presets.default, presets[this.chainId])
        const target = secondary.current === 'custom' ? secondary.custom : currentPresets[secondary.current]
        if (!this.secondary.provider || this.secondary.currentSecondaryTarget !== target) {
          log.info('    Creating secondary connection becasue it didn\'t exist or the target changed')
          if (this.secondary.provider) this.secondary.provider.close()
          this.secondary.provider = null
          this.secondary.currentSecondaryTarget = target
          this.secondary.status = 'loading'
          this.secondary.connected = false
          this.secondary.type = ''

          this._createProvider(target, 'secondary')

          this.secondary.provider.on('connect', () => {
            log.info('    Secondary connection connected')
            this.getNetwork(this.secondary.provider, (err, response) => {
              if (err) {
                this.primary.connected = false
                this.primary.type = ''
                this.primary.status = 'error'
                this.update('secondary')
              } else {
                this.secondary.network = !err && response && !response.error ? response.result : ''
                if (this.secondary.network && this.secondary.network !== this.chainId) {
                  this.secondary.connected = false
                  this.secondary.type = ''
                  this.secondary.status = 'chain mismatch'
                  this.update('secondary')
                } else {
                  this.secondary.status = 'connected'
                  this.secondary.connected = true
                  this.secondary.type = ''

                  this._handleConnection('secondary')
                }
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
            if (status === 'connected' && this.secondary.network && this.secondary.network !== this.chainId) {
              this.secondary.connected = false
              this.secondary.type = ''
              this.secondary.status = 'chain mismatch'
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

    if (chain.on && connection.primary.on) {
      log.info('    Primary connection: ON')
      const connection = store('main.networks', this.type, this.chainId, 'connection')
      const { primary } = connection
      const presets = store('main.networkPresets', this.type)
      const currentPresets = Object.assign({}, presets.default, presets[this.chainId])
      const target = primary.current === 'custom' ? primary.custom : currentPresets[primary.current]
      if (!this.primary.provider || this.primary.currentPrimaryTarget !== target) {
        log.info('    Creating primary connection becasue it didn\'t exist or the target changed')
        if (this.primary.provider) this.primary.provider.close()
        this.primary.provider = null
        this.primary.currentPrimaryTarget = target
        this.primary.status = 'loading'
        this.primary.connected = false
        this.primary.type = ''

        this._createProvider(target, 'primary')

        this.primary.provider.on('connect', () => {
          log.info('    Primary connection connected')
          this.getNetwork(this.primary.provider, (err, response) => {
            if (err) {
              this.primary.connected = false
              this.primary.type = ''
              this.primary.status = 'error'
              this.update('primary')
            } else {
              this.primary.network = !err && response && !response.error ? response.result : ''
              if (this.primary.network && this.primary.network !== this.chainId) {
                this.primary.connected = false
                this.primary.type = ''
                this.primary.status = 'chain mismatch'
                this.update('primary')
              } else {
                this.primary.status = 'connected'
                this.primary.connected = true
                this.primary.type = ''

                this._handleConnection('primary')
              }
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
          if (status === 'connected' && this.primary.network && this.primary.network !== this.chainId) {
            this.primary.connected = false
            this.primary.type = ''
            this.primary.status = 'chain mismatch'
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

  close () {
    if (this.observer) this.observer.remove()
    if (this.primary.provider) this.primary.provider.close()
    if (this.secondary.provider) this.secondary.provider.close()
    this.primary = { status: 'loading', network: '', type: '', connected: false }
    this.secondary = { status: 'loading', network: '', type: '', connected: false }
    this.update('primary')
    this.update('secondary')
  }

  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
  }

  send (payload, res) {
    if (this.primary.provider && this.primary.connected) { // && this.primary.network === store('main.currentNetwork.id')) {
      this.primary.provider.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary.provider && this.secondary.connected) { //  && this.secondary.network === store('main.currentNetwork.id')) {
      this.secondary.provider.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else {
      this.resError('Not connected to Ethereum network', payload, res)
    }
  }
}

class Chains extends EventEmitter {
  constructor () {
    super()
    this.connections = {}

    store.observer(() => {
      const networks = store('main.networks')
      Object.keys(networks).forEach(type => {
        this.connections[type] = this.connections[type] || {}
        Object.keys(networks[type]).forEach(chainId => {
          const chainConfig = networks[type][chainId]
          if (chainConfig.on && !this.connections[type][chainId]) {
            this.connections[type][chainId] = new ChainConnection(type, chainId)

            this.connections[type][chainId].on('connect', (...args) => {
              this.emit(`connect:${type}:${chainId}`, ...args)
              const current = store('main.currentNetwork')
              if (current.type === type && current.id === chainId) this.emit('connect', ...args)
            })

            this.connections[type][chainId].on('close', (...args) => {
              this.emit(`close:${type}:${chainId}`, ...args)
              const current = store('main.currentNetwork')
              if (current.type === type && current.id === chainId) this.emit('close', ...args)
            })

            this.connections[type][chainId].on('data', (...args) => {
              this.emit(`data:${type}:${chainId}`, ...args)
              const current = store('main.currentNetwork')
              if (current.type === type && current.id === chainId) this.emit('data', ...args)
            })

            this.connections[type][chainId].on('error', (...args) => {
              this.emit(`error:${type}:${chainId}`, ...args)
              const current = store('main.currentNetwork')
              if (current.type === type && current.id === chainId) this.emit('error', ...args)
            })

          } else if (!chainConfig.on && this.connections[type][chainId]) {
            this.connections[type][chainId].removeAllListeners()
            this.connections[type][chainId].close()
            delete this.connections[type][chainId]
          }
        })
      })
    })
  }

  send (payload, res, targetChain) {
    let chainType, chainId
    if (targetChain) {
      const { type, id } = targetChain
      chainType = type
      chainId = id
    } else { // Use currently selected network
      const { type, id } = store('main.currentNetwork')
      chainType = type
      chainId = id
    }
    if (this.connections[chainType] && this.connections[chainType][chainId]) {
      this.connections[chainType][chainId].send(payload, res)
    } else {
      log.error(`Connection for ${chainType} chain with chainId ${chainId} did not exist for send`)
    }
    // this.connect(store('main.networks', type, id, 'connection'))
    // store('main.networks', type, chainId, 'connection')
  }

  syncDataEmit (emitter) {
    this.syncDataEmitter = emitter
  }

  emit(type, ...args) {
    if (this.syncDataEmitter && type.startsWith('data:')) this.syncDataEmitter.emit(type, ...args)
    super.emit(type, ...args)
  }
}

module.exports = new Chains()
