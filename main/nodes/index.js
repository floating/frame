// status = Network Mismatch, Not Connected, Connected, Standby, Syncing

const EventEmitter = require('events')
const provider = require('eth-provider')
const log = require('electron-log')

const store = require('../store')

class Nodes extends EventEmitter {
  constructor () {
    super()
    this.local = {
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
      this.connect(store('main.connection'))
    })
  }

  update (priority) {
    if (priority === 'local') {
      const { status, connected, type, network } = this.local
      const details = { status, connected, type, network }
      log.info('    Updating local connection to status, ', details)
      store.setLocal(details)
    } else if (priority === 'secondary') {
      const { status, connected, type, network } = this.secondary
      const details = { status, connected, type, network }
      log.info('    Updating secondary connection to status, ', details)
      store.setSecondary(details)
    }
  }

  getNetwork (provider, cb) { provider.sendAsync({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }, cb) }

  getNodeType (provider, cb) { provider.sendAsync({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }, cb) }

  connect (connection) {
    log.info(' ')
    log.info('Connection has been updated')
    if (this.network !== connection.network) {
      if (this.local.provider) this.local.provider.close()
      if (this.secondary.provider) this.secondary.provider.close()
      this.local = { status: 'loading', network: '', type: '', connected: false }
      this.secondary = { status: 'loading', network: '', type: '', connected: false }
      this.update('local')
      this.update('secondary')
      log.info('    Network changed from ' + this.network + ' to ' + connection.network)
      this.network = connection.network
    }
    
    // Secondary connection is on
    if (connection.secondary.on) {
      log.info('    Secondary connection: ON')
      if (connection.local.on && connection.local.status === 'connected') {
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
        const settings = store('main.connection.secondary.settings', store('main.connection.network'))
        const target = settings.options[settings.current]
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
              if (this.secondary.network && this.secondary.network !== store('main.connection.network')) {
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
            if (status === 'connected' && this.secondary.network && this.secondary.network !== store('main.connection.network')) {
              this.secondary.connected = false
              this.secondary.type = ''
              this.secondary.status = 'network mismatch'
              this.update('secondary')
            } else {
              this.local.status = status
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


    if (connection.local.on) {
      log.info('    local connection: ON')
      const settings = store('main.connection.local.settings', store('main.connection.network'))
      const target = settings.options[settings.current]
      if (!this.local.provider || this.local.currentLocalTarget !== target) {
        log.info('    Creating local connection becasue it didn\'t exist or the target changed')
        if (this.local.provider) this.local.provider.close()
        this.local.provider = null
        this.local.currentLocalTarget = target
        this.local.status = 'loading'
        this.local.connected = false
        this.local.type = ''
        this.update('local')
        this.local.provider = provider(target, { name: 'local', infuraId: '786ade30f36244469480aa5c2bf0743b' })
        this.local.provider.on('connect', () => {
          log.info('    Local connection connected')
          this.getNetwork(this.local.provider, (err, response) => {
            this.local.network = !err && response && !response.error ? response.result : ''
            if (this.local.network && this.local.network !== store('main.connection.network')) {
              this.local.connected = false
              this.local.type = ''
              this.local.status = 'network mismatch'
              this.update('local')
            } else {
              this.local.status = 'connected'
              this.local.connected = true
              this.local.type = ''
              this.update('local')
              this.emit('connect')
            }
          })
        })
        this.local.provider.on('close', () => {
          log.info('    local connection close')
          this.local.connected = false
          this.local.type = ''
          this.local.network = ''
          this.update('local')
          this.emit('close')
        })
        this.local.provider.on('status', status => {
          if (status === 'connected' && this.local.network && this.local.network !== store('main.connection.network')) {
            this.local.connected = false
            this.local.type = ''
            this.local.status = 'network mismatch'
            this.update('local')
          } else {
            this.local.status = status
            this.update('local')
          }
        })
        this.local.provider.on('data', data => this.emit('data', data))
        this.local.provider.on('error', err => this.emit('error', err))
      }
    } else {
      log.info('    local connection: OFF')
      if (this.local.provider) this.local.provider.close()
      this.local.provider = null
      if (this.local.status !== 'off') {
        this.local.status = 'off'
        this.local.connected = false
        this.local.type = ''
        this.local.network = ''
        this.update('local')
      }
    }
  }

  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
  }

  send (payload, res) {
    console.log(payload)
    if (this.local.provider && this.local.connected && this.local.network === store('main.connection.network')) {
      this.local.provider.sendAsync(payload, (err, result) => {
        if (err) return this.resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary.provider && this.secondary.connected && this.secondary.network === store('main.connection.network')) {
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




    // // Local connection is on
    // if (connection.local.on) {
    //   log.info('    Local connection: ON')
    //   if (!this.local.provider) {
    //     log.info('    Local connection doesn\'t exist, creating connection')
    //     this.local.provider = provider('direct', { name: 'local', infuraId: '786ade30f36244469480aa5c2bf0743b' })

    //     // Local connection connected
    //     this.local.provider.on('connect', details => {
    //       log.info('    Local connection connected')
    //       this.getNetwork(this.local.provider, (netErr, netResponse) => {
    //         this.getNodeType(this.local.provider, (typeErr, typeResponse) => {
    //           this.local.network = !netErr && netResponse && !netResponse.error ? netResponse.result : ''
    //           this.local.type = !typeErr && typeResponse && !typeResponse.error ? typeResponse.result.split('/')[0] : '?'
    //           if (this.local.type === 'EthereumJS TestRPC') this.local.type = 'Ganache'
    //           if (this.local.network && this.local.network !== store('main.connection.network')) {
    //             this.local.connected = false
    //             this.local.status = 'network mismatch'
    //             this.update('local')
    //           } else {
    //             this.local.status = 'connected'
    //             this.local.connected = true
    //             this.update('local')
    //             this.emit('connect')
    //           }
    //         })
    //       })
    //     })

    //     // Local connection close
    //     this.local.provider.on('close', details => {
    //       log.info('    Local connection closed')
    //       this.local.connected = false
    //       this.local.type = ''
    //       this.local.network = ''
    //       this.update('local')
    //       this.emit('close')
    //     })

    //     // Local connection status
    //     this.local.provider.on('status', status => {
    //       if (status === 'connected' && this.local.network && this.local.network !== store('main.connection.network')) {
    //         this.local.connected = false
    //         this.local.status = 'network mismatch'
    //         this.update('local')
    //       } else {
    //         const current = this.local.status
    //         if ((current === 'loading' || current === 'not found' || current === 'off' || current === 'network mismatch') && status === 'disconnected') status = 'not found'
    //         this.local.status = status
    //         this.update('local')
    //       }
    //     })

    //     this.local.provider.on('data', data => this.emit('data', data))
    //     this.local.provider.on('error', err => this.emit('error', err))
    //   } else {
    //     log.info('    Local connection already exists')
    //   }
    // // Local connection is set OFF by the user
    // } else {
    //   log.info('    Local connection: OFF')
    //   if (this.local.provider) this.local.provider.close()
    //   this.local.provider = null
    //   if (this.local.status !== 'off') {
    //     this.local.status = 'off'
    //     this.local.connected = false
    //     this.local.type = ''
    //     this.local.network = ''
    //     this.update('local')
    //   }
    // }

