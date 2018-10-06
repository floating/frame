const { ipcMain } = require('electron')
const log = require('electron-log')

const signers = require('../signers')
const launch = require('../launch')
const provider = require('../provider')

const rpc = {
  signTransaction: signers.signTransaction,
  signPersonal: signers.signPersonal,
  getAccounts: signers.getAccounts,
  getCoinbase: signers.getCoinbase,
  getSigners: signers.getSigners,
  setSigner: signers.setSigner,
  setSignerIndex: signers.setSignerIndex,
  unsetSigner: signers.unsetSigner,
  trezorPin: signers.trezorPin,
  launchEnable: launch.enable,
  launchDisable: launch.disable,
  launchStatus: launch.status,
  providerSend: (payload, cb) => provider.send(payload, cb),
  connectionStatus: (cb) => {
    cb(null, {
      local: {
        status: provider.connection.local.status,
        network: provider.connection.local.network,
        type: provider.connection.local.type,
        connected: provider.connection.local.connected
      },
      secondary: {
        status: provider.connection.secondary.status,
        network: provider.connection.secondary.network,
        type: provider.connection.secondary.type,
        connected: provider.connection.secondary.connected
      }
    })
  },
  approveRequest (req, cb) {
    log.info('approveRequest ', req.handlerId)
    signers.setRequestPending(req)
    provider.approveRequest(req, (err, res) => {
      if (err) return signers.setRequestError(req.handlerId, err)
      signers.setRequestSuccess(req.handlerId, res)
    })
  },
  declineRequest (req, cb) {
    log.info('declineRequest ', req.handlerId)
    signers.declineRequest(req.handlerId)
    provider.declineRequest(req)
  },
  removeRequest (req, cb) {
    log.info('removeRequest', req.handlerId)
    signers.removeRequest(req.handlerId)
  }
}

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

ipcMain.on('main:rpc', (event, id, method, ...args) => {
  id = unwrap(id)
  method = unwrap(method)
  args = args.map(arg => unwrap(arg))
  if (rpc[method]) {
    rpc[method](...args, (...args) => {
      event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
    })
  } else {
    let args = [new Error('Unknown RPC method: ' + method)]
    event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
  }
})
