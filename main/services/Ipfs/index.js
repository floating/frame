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

    // On 'daemon ready' -> switch client state
    this.on('stdout', (stdout) => {
      if (stdout.match(/Daemon is ready\n$/i)) {
        log.info('ipfs: ready')
        this.emit('state', 'ready')
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
