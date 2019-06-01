const Client = require('../Client')
const store = require('../../store')
const log = require('electron-log')

class IPFS extends Client {
  constructor (options) {
    super('ipfs', options)

    // On 'service ready' -> start ipfs
    this.on('ready', async () => {
      // Run 'ipfs init'
      this.init()

      // Run 'ipfs daemon'
      this._run(['daemon'])
    })

    // On 'daemon ready' -> switch client state
    this.on('stdout', (stdout) => {
      if (stdout.match(/Daemon is ready\n$/i)) {
        log.info('ipfs: ready')
        this.emit('state', 'ready')
      }
    })
  }

  start () {
    // Ensure client isn't already running
    if (store('main.clients.ipfs.state') !== 'off') return

    // Run start sequence
    this._start()
  }

  stop () {
    // Ensure state is 'ready'
    if (store('main.clients.ipfs.state') !== 'ready') return

    // Stop client
    this._stop()
  }

  async init () {
    try {
      await this._runOnce(['init'])
      log.info('ipfs: repo initiated')
    } catch (err) {
      log.info('ipfs: repo already initiated')
    }
  }
}

module.exports = new IPFS()
