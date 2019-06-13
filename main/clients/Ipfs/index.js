const log = require('electron-log')

const windows = require('../../windows')

const Client = require('../Client')

class IPFS extends Client {
  constructor (options) {
    super('ipfs', options)

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
}

module.exports = new IPFS()
