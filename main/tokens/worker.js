const { parentPort } = require('worker_threads')
// const log = require('electron-log')
const scan = require('./scan.js')

parentPort.on('message', async (message = {}) => {
  if (message.method === 'exit') return parentPort.close()
  if (message.method === 'scan') {
    const args = message.args
    const address = args[0]
    const omit = args[1]
    const found = await scan(...args)
    parentPort.postMessage({ type: 'scan', address, omit, found })
  }
})
