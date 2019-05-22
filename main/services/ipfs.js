const Service = require('./Service/index')
const store = require('../store')
const log = require('electron-log')

class IPFS extends Service {
  constructor(options) {
    super('ipfs', options)
  }

  start() {
    // On 'service ready' -> start ipfs
    this.on('ready', async () => {
      // Run 'ipfs init'
      this.init()
      // Run 'ipfs daemon'
      this._run(['daemon'])
    })

    // On 'daemon ready' -> switch client state
    this.on('stdout', (stdout) => {
      console.log(stdout)
      if (stdout.includes('Daemon is ready')) {
        log.info('ipfs: ready')
        store.setClientState('ipfs', 'ready')
      }
    })

    // Run start sequence
    this._start()
  }

  stop() { this._stop() }

  async init() {
    try {
      log.info('IPFS initiated')
      await this._runOnce(['init'])
    }
    catch (err) { log.info('ipfs: already initiated') }
  }
}

module.exports = new IPFS()