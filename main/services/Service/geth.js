const Service = require('./index')
const { execFile } = require('child_process')

class Geth extends Service {
  constructor() {
    super('geth')
    this.on('stdout', console.log)
    this.on('stderr', console.error)
    this.on('serror', console.error)
  }

  start () {
    this.on('ready', () => this._start())
    this.init()
  }

  _start () {
    console.log('Start')
    this._run(['--networkid', '4', '--rinkeby', '--syncmode', 'light', '--nousb', '--ws'])
  }

  _syncing () {
    this._runOnce(['--exec', 'eth.syncing', 'attach', 'ws://127.0.0.1:8546'], (err, stdout, stderr) => {
      console.log(err, stdout, stderr)
    })
  }

}

// // DEBUG
// const geth = new Geth()
// geth.start()