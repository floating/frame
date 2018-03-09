const { ipcMain } = require('electron')
const signers = require('../signers')

const rpc = {
  signTransaction: signers.signTransaction,
  getAccounts: signers.getAccounts,
  getCoinbase: signers.getCoinbase,
  getSigners: signers.getSigners,
  setSigner: signers.setSigner,
  trezorPin: signers.trezorPin
}

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

ipcMain.on('main:rpc', (event, id, method, ...args) => {
  id = unwrap(id)
  method = unwrap(method)
  args = args.map(arg => unwrap(arg))
  rpc[method](...args, (...args) => event.sender.send('main:rpc', id, ...args.map(arg => wrap(arg))))
})
