const path = require('path')
const { fork } = require('child_process')
const log = require('electron-log')
const store = require('../store')

let tokenWorker, followTimer, setupTimer
let scanning = false
let stopped = true
let exited = false

const setupWorker = (initial) => {
  clearTimeout(setupTimer)
  if (tokenWorker && tokenWorker.kill) tokenWorker.kill()
  tokenWorker = fork(path.resolve(__dirname, 'worker.js'))
  exited = false
  tokenWorker.on('message', message => {
    if (message.type === 'scan') {
      scanning = false
      store.setTokens(message.address, message.found)
      if (!stopped) {
        followTimer = setTimeout(() => {
          scan(message.address, message.omit, Object.keys(message.found))
        }, 15000)
      }
    }
  })
  tokenWorker.on('error', err => {
    if (err.code === 'ERR_IPC_CHANNEL_CLOSED') setupWorker()
    log.error(new Error(`Token worker error with exit code ${err.code}`))
  })
  tokenWorker.on('exit', code => {
    exited = true
    setupTimer = setTimeout(() => {
      if (!stopped) setupWorker()
    }, 15000)
  })
  if (initial) tokenWorker.send(initial)
}

setTimeout(() => setupWorker(), 3200)

const scan = (address, omitList = [], knownList) => {
  if (scanning) return console.log('Token scan: already scanning')
  if (exited) setupWorker()
  clearTimeout(followTimer)
  scanning = true
  stopped = false
  const message = { method: 'scan', args: [address, omitList, knownList] }
  if (tokenWorker && tokenWorker.send) {
    tokenWorker.send(message)
  } else {
    setupWorker(message)
  }
}

const stop = () => {
  stopped = true
  clearTimeout(followTimer)
}

const kill = () => {
  clearTimeout(followTimer)
  if (tokenWorker && tokenWorker.kill) tokenWorker.kill()
}

module.exports = { scan, stop, kill }
