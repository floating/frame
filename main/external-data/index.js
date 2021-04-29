const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

let scanWorker

function createWorker (address) {
  scanWorker = fork(path.resolve(__dirname, 'worker.js'))

  scanWorker.on('message', message => {
    if (message.type === 'tokens') {
      store.setBalances(address, message.found)
    }

    if (message.type === 'rates') {
      store.setRates(message.rates)
    }

    if (message.type === 'log') {
      log[message.level](message.msg)
    }
  })

  scanWorker.on('error', err => {
    // if (err.code === 'ERR_IPC_CHANNEL_CLOSED') {
    //   console.error('scan worker IPC channel closed! restarting worker')
    // }
    log.error(new Error(`scan worker error with exit code: ${err.code}`))
  })

  scanWorker.on('exit', code => {
    log.warn(`scan worker exited with code ${code}, restarting worker`)
    setTimeout(() => scan(address), 15000)
  })

  return scanWorker
}

const scan = (address, omitList = [], knownList) => {
  scanWorker = scanWorker || createWorker(address)

  log.info('starting external data scanner')

  scanWorker.send({ command: 'start', args: [address] })
}

const stop = () => {
  log.info('stopping external data scanner')

  if (scanWorker) scanWorker.send({ command: 'stop' })
}

const kill = () => {
  if (scanWorker) {
    scanWorker.kill()
    scanWorker = null
  }
}

module.exports = { scan, stop, kill }
