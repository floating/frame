const { ipcMain } = require('electron')
// const log = require('electron-log')

const accounts = require('../accounts')
const signers = require('../signers')
const launch = require('../launch')
const provider = require('../provider')
const store = require('../store')

const rpc = {
  getState: cb => {
    cb(null, store())
  },
  signTransaction: accounts.signTransaction,
  signMessage: accounts.signMessage,
  getAccounts: accounts.getAccounts,
  getCoinbase: accounts.getCoinbase,
  // Review
  // getSigners: signers.getSigners,
  setSigner: (id, cb) => {
    accounts.setSigner(id, cb)
    provider.accountsChanged(accounts.getSelectedAddresses())
  },
  setSignerIndex: (index, cb) => {
    accounts.setSignerIndex(index, cb)
    provider.accountsChanged(accounts.getSelectedAddresses())
  },
  unsetSigner: (id, cb) => {
    signers.lock(id)
    accounts.unsetSigner(cb)
    provider.accountsChanged(accounts.getSelectedAddresses())
  },
  // setSignerIndex: signers.setSignerIndex,
  // unsetSigner: signers.unsetSigner,
  trezorPin: accounts.trezorPin,
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
    accounts.setRequestPending(req)
    if (req.type === 'transaction') {
      provider.approveRequest(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        setTimeout(() => accounts.setTxSent(req.handlerId, res), 1800)
      })
    } else if (req.type === 'sign') {
      provider.approveSign(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        accounts.setRequestSuccess(req.handlerId, res)
      })
    }
  },
  declineRequest (req, cb) {
    if (req.type === 'transaction' || req.type === 'sign') {
      accounts.declineRequest(req.handlerId)
      provider.declineRequest(req)
    }
  },
  addAragon (account, cb) {
    accounts.addAragon(account)
    cb(null)
  },
  addPhrase (pharse, password, cb) {
    signers.createFromPhrase(pharse, password, cb)
  },
  unlockSigner (id, unlock, cb) {
    signers.unlock(id, unlock, cb)
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
