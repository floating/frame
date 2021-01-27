// const log = require('electron-log')
const scan = require('./scan.js')

process.on('message', async (message = {}) => {
  if (message.method === 'scan') {
    const args = message.args
    const address = args[0]
    const omit = args[1]
    const found = await scan(...args)
    process.send({ type: 'scan', address, omit, found })
  }
})
