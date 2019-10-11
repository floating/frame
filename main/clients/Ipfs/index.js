const { app } = require('electron')
const path = require('path')
const log = require('electron-log')
const ipfsHttpClient = require('ipfs-http-client')

const Client = require('../Client')
const { userData } = require('../../util')
const peers = require('./peers.json')

// Mock windows module if running tests
const windows = app ? require('../../windows') : { broadcast: () => {} }

class IPFS extends Client {
  constructor (options) {
    super('ipfs', options)

    process.env.IPFS_PATH = path.resolve(userData, 'ipfs-repo')

    this.api = null

    // On 'service ready' -> start ipfs
    this.on('ready', async () => {
      // Run 'ipfs init'
      await this.init()

      // Setup HTTP client
      this.api = ipfsHttpClient(this.getConfig('Addresses.API'))

      // Run 'ipfs daemon'
      this.run(['daemon', '--enable-pubsub-experiment'], (err) => {
        if (err.message.includes('ipfs daemon is running')) {
          windows.broadcast('main:action', 'notify', 'ipfsAlreadyRunning')
        }
      })
    })

    // Handle stdout
    this.on('stdout', async (stdout) => {
      // On 'daemon ready' -> client state 'ready'
      if (stdout.match(/Daemon is ready\n$/i)) {
        // Add Frame peers
        try {
          await Promise.all(peers.map((peer) => this.runOnce(['swarm', 'connect', peer])))
        } catch (err) {
          log.error('Failed to connect to Frame IPFS peers', err)
        }

        // TODO: Remove logging of active peers below
        const activePeers = await this.runOnce(['swarm', 'peers'])
        log.info('ipfs: active peers', activePeers)

        // Set state to 'ready'
        log.info('ipfs: ready')
        this.emit('state', 'ready')
      }
      // On 'repo migration required' -> run migration
      if (stdout.match(/Run migrations now/i)) {
        log.info('ipfs: client asking to run repo migration')
        this.process.stdin.write('y\n')
      }
    })
  }

  async init () {
    try {
      await this.runOnce(['init'])
    } catch (err) {
      log.info('ipfs: repo already initiated')
    }
  }

  async getConfig (key) {
    const config = key ? await this.runOnce(['config', key]) : await this.runOnce(['config', 'show'])
    try {
      config.trim()
      return JSON.parse(config)
    } catch (err) {
      return config
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
