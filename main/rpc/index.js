const { ipcMain } = require('electron')
const signers = require('../signers')
const launch = require('../launch')

const rpc = {
  signTransaction: signers.signTransaction,
  signPersonal: signers.signPersonal,
  getAccounts: signers.getAccounts,
  getCoinbase: signers.getCoinbase,
  getSigners: signers.getSigners,
  setSigner: signers.setSigner,
  unsetSigner: signers.unsetSigner,
  trezorPin: signers.trezorPin,
  launchEnable: launch.enable,
  launchDisable: launch.disable,
  launchStatus: launch.status
}

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

ipcMain.on('main:rpc', (event, id, method, ...args) => {
  id = unwrap(id)
  method = unwrap(method)
  args = args.map(arg => unwrap(arg))
  rpc[method](...args, (...args) => {
    event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
  })
})
