const { app } = require('electron')
const log = require('electron-log')
const axios = require('axios')
const ipfsHttpClient = require('ipfs-http-client')

const Client = require('../Client')

// Mock windows module if running tests
const windows = app ? require('../../windows') : { broadcast: () => {} }

class IPFS extends Client {
  constructor (options) {
    super('ipfs', options)

    // TODO: Handle error when client not installed
    if (this.isInstalled) {
      this.api = ipfsHttpClient(this.getConfig('Addresses.API'))
    } else {
      this.api = null
    }

    // On 'service ready' -> start ipfs
    this.on('ready', async () => {
      // Run 'ipfs init'
      this.init()

      // Define error handler
      const errorHandler = (err) => {
        if (err.message.includes('ipfs daemon is running')) {
          windows.broadcast('main:action', 'notify', 'ipfsAlreadyRunning')
        }
      }

      // Run 'ipfs daemon'
      this.run(['daemon'], errorHandler)
    })

    // Handle stdout
    this.on('stdout', (stdout) => {
      // On 'daemon ready' -> client state 'ready'
      if (stdout.match(/Daemon is ready\n$/i)) {
        log.info('ipfs: ready')
        this.emit('state', 'ready')
      }
      // On 'repo migration required' -> run migration
      if (stdout.match(/Run migrations now/i)) {
        log.info('ipfs: clint asking to run repo migration')
        this.process.stdin.write('y\n')
      }
    })
  }

  async init () {
    try {
      await this.runOnce(['init'])
      log.info('ipfs: repo initiated')
    } catch (err) {
      log.info('ipfs: repo already initiated')
    }
  }

  async getConfig (key) {
    const config = key ? await this.runOnce(['config', key]) : await this.runOnce(['config', 'show'])
    try {
      return JSON.parse(config)
    } catch (err) {
      return config.trim()
    }
  }

  async setConfig (key, value) {
    await this.runOnce(['config', key, value])
  }

  async isRunning () {
    try {
      await this.runOnce(['diag', 'cmds'])
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = new IPFS()
