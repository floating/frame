// const log = require('electron-log')
const scan = require('./scan.js')

let scanTimeout = setTimeout(() => process.kill(process.pid, 'SIGHUP'), 60 * 1000)

process.on('message', async (message = {}) => {
  if (message.method === 'scan') {
    clearTimeout(scanTimeout)
    const args = message.args
    const address = args[0]
    const omit = args[1]
    const found = await scan(...args)

    process.send({ type: 'scan', address, omit, found })
    scanTimeout = setTimeout(() => process.kill(process.pid, 'SIGHUP'), 60 * 1000)
  }
})
