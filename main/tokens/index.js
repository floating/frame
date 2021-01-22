const path = require('path')
const { Worker } = require('worker_threads')
const log = require('electron-log')
const store = require('../store')

let tokenWorker, followTimer, setupTimer
let scanning = false
let stopped = true

const setupWorker  = (initial) => {
  clearTimeout(setupTimer)
  if (tokenWorker && tokenWorker.postMessage) tokenWorker.postMessage({ method: 'exit' })
  tokenWorker = new Worker(path.resolve(__dirname, 'worker.js'))
  tokenWorker.on('message', message => {
    if (message.type === 'scan') {
      scanning = false
      store.setTokens(message.address, message.found)
      if (!stopped) followTimer = setTimeout(() => {
        scan(message.address, message.omit, Object.keys(message.found))
      }, 15000)
    }
  })
  tokenWorker.on('error', code => {
    log.error(new Error(`Token worker error with exit code ${code}`))
  })
  tokenWorker.on('exit', code => {
    setupTimer = setTimeout(() => {
      setupWorker()
    }, 15000)
  })
  if (initial) tokenWorker.postMessage(initial)
}

setupWorker()

const scan = (address, omitList = [], knownList) => {
  if (scanning) return console.log('Token scan: already scanning')
  clearTimeout(followTimer)
  scanning = true
  stopped = false
  const message = { method: 'scan', args: [address, omitList, knownList] }
  if (tokenWorker && tokenWorker.postMessage) {
    tokenWorker.postMessage(message)
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
  if (tokenWorker && tokenWorker.postMessage) tokenWorker.postMessage({ method: 'exit' })
}

module.exports = { scan, stop, kill }
