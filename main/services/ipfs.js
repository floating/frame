const Service = require('./Service/index')
const store = require('../store')
const log = require('electron-log')

class IPFS extends Service {
  constructor (options) {
    super('ipfs', options)
  }

  start () {
    this.on('ready', async () => {

      // Run ipfs init
      try {
        log.info('IPFS initiated')
        await this._runOnce(['ps'])
      }
      catch(err) { log.info('ipfs: already initiated') }

      // Wait for daemon to get ready
      // TODO: Swtich to stream!
      this.on('stdout', (stdout) => {
        console.log(stdout)
        if (stdout.includes('Daemon is ready')) {
          log.info('ipfs: ready')
          store.setClientState('ipfs', 'ready')
        }
      })

      // Start daemon
      this._run(['daemon'])

      // // Prepare client arguments
      // let args = ['--networkid', networkId, '--syncmode', mode, '--nousb', '--rpc']
      // if (networkFlag) args.push(networkFlag)

      // // Start client
      // this._run(args)

    })
    this._start()
  }

  stop () {
    // Terminate service
    this._stop()
  }
}

module.exports = new IPFS()

// DEBUG
const ipfs = new IPFS({ log: false })
ipfs.start()
setTimeout(() => {
  ipfs.stop()
}, 10000);

store.observer(_ => console.log(store('main.clients.ipfs')))