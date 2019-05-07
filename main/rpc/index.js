const { ipcMain } = require('electron')
const log = require('electron-log')

const signers = require('../signers')
const launch = require('../launch')
const provider = require('../provider')
const store = require('../store')
const { launchBrowser } = require('../browser')

const rpc = {
  getState: cb => {
    cb(null, store())
  },
  signTransaction: signers.signTransaction,
  signMessage: signers.signMessage,
  getAccounts: signers.getAccounts,
  getCoinbase: signers.getCoinbase,
  getSigners: signers.getSigners,
  setSigner: (id, cb) => {
    signers.setSigner(id, cb)
    provider.accountsChanged(signers.getSelectedAccounts())
  },
  setSignerIndex: (index, cb) => {
    signers.setSignerIndex(index, cb)
    provider.accountsChanged(signers.getSelectedAccounts())
  },
  unsetSigner: (cb) => {
    signers.unsetSigner(cb)
    provider.accountsChanged(signers.getSelectedAccounts())
  },
  // setSignerIndex: signers.setSignerIndex,
  // unsetSigner: signers.unsetSigner,
  trezorPin: signers.trezorPin,
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
    signers.setRequestPending(req)
    if (req.type === 'transaction') {
      provider.approveRequest(req, (err, res) => {
        if (err) return signers.setRequestError(req.handlerId, err)
        setTimeout(() => signers.setTxSent(req.handlerId, res), 1800)
      })
    } else if (req.type === 'sign') {
      provider.approveSign(req, (err, res) => {
        if (err) return signers.setRequestError(req.handlerId, err)
        signers.setRequestSuccess(req.handlerId, res)
      })
    }
  },
  declineRequest (req, cb) {
    if (req.type === 'transaction' || req.type === 'sign') {
      signers.declineRequest(req.handlerId)
      provider.declineRequest(req)
    }
  },
  launchBrowser (address, cb) {
    log.info(`Launching ${address} in browser`)
    launchBrowser(address)
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
