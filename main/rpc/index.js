const { ipcMain, dialog } = require('electron')
const fs = require('fs')
// const log = require('electron-log')
const utils = require('web3-utils')

const accounts = require('../accounts')
const signers = require('../signers')
const launch = require('../launch')
const provider = require('../provider')
const store = require('../store')
const dapps = require('../dapps')
const ens = require('../ens')
const ipfs = require('../ipfs')


const { resolveName } = require('../accounts/aragon')

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
    setTimeout(() => {
      accounts.balanceScan()
    }, 320)
  },
  setSignerIndex: (index, cb) => {
    accounts.setSignerIndex(index, cb)
    provider.accountsChanged(accounts.getSelectedAddresses())
    setTimeout(() => {
      accounts.balanceScan()
    }, 320)
  },
  unsetSigner: (id, cb) => {
    accounts.unsetSigner(cb)
    provider.accountsChanged(accounts.getSelectedAddresses())
    accounts.balanceScan()
  },
  // setSignerIndex: signers.setSignerIndex,
  // unsetSigner: signers.unsetSigner,
  trezorPin: (id, pin, cb) => signers.trezorPin(id, pin, cb),
  trezorPhrase: (id, phrase, cb) => signers.trezorPhrase(id, phrase, cb),
  launchStatus: launch.status,
  providerSend: (payload, cb) => provider.send(payload, cb),
  connectionStatus: (cb) => {
    cb(null, {
      primary: {
        status: provider.connection.primary.status,
        network: provider.connection.primary.network,
        type: provider.connection.primary.type,
        connected: provider.connection.primary.connected
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
    } else if (req.type === 'signTypedData') {
      provider.approveSignTypedData(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        accounts.setRequestSuccess(req.handlerId, res)
      })
    }
  },
  declineRequest (req, cb) {
    if (
      req.type === 'transaction' ||
      req.type === 'sign' ||
      req.type === 'signTypedData'
    ) {
      accounts.declineRequest(req.handlerId)
      provider.declineRequest(req)
    }
  },
  removeRequestWarning (reqId) {
    accounts.removeRequestWarning(reqId)
  },
  addAragon (account, cb) {
    accounts.addAragon(account, cb)
  },
  createAccount (address, options, cb) {
    if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.add(address, options)
    cb()
  },
  removeAccount (address, options, cb) {
    if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.remove(address)
    cb()
  },
  createFromPhrase (phrase, password, cb) {
    signers.createFromPhrase(phrase, password, cb)
  },
  locateKeystore (cb) {
    const keystore = dialog.showOpenDialog({ properties: ['openFile'] })
    if (keystore && keystore.length) {
      fs.readFile(keystore[0], 'utf8', (err, data) => {
        if (err) return cb(err)
        try { cb(null, JSON.parse(data)) } catch (err) { cb(err) }
      })
    } else {
      cb(new Error('No Keystore Found'))
    }
  },
  createFromKeystore (keystore, keystorePassword, password, cb) {
    signers.createFromKeystore(keystore, keystorePassword, password, cb)
  },
  createFromPrivateKey (privateKey, password, cb) {
    signers.createFromPrivateKey(privateKey, password, cb)
  },
  addPrivateKey (id, privateKey, password, cb) {
    signers.addPrivateKey(id, privateKey, password, cb)
  },
  removePrivateKey (id, index, password, cb) {
    signers.removePrivateKey(id, index, password, cb)
  },
  addKeystore (id, keystore, keystorePassword, password, cb) {
    signers.addKeystore(id, keystore, keystorePassword, password, cb)
  },
  unlockSigner (id, password, cb) {
    signers.unlock(id, password, cb)
  },
  lockSigner (id, cb) {
    signers.lock(id, cb)
  },
  remove (id, cb) {
    signers.remove(id, cb)
  },
  resolveAragonName (name, cb) {
    resolveName(name).then(result => cb(null, result)).catch(cb)
  },
  verifyAddress (cb) {
    accounts.verifyAddress(true, cb)
  },
  setGasPrice (netType, netId, price, level, handlerId, cb) {
    accounts.setGasPrice(price, handlerId, cb)
    store.setGasDefault(netType, netId, level, price)
  },
  setGasLimit (limit, handlerId, cb) {
    accounts.setGasLimit(limit, handlerId, cb)
  },
  // flow
  async flowCommand (command, cb) {
    // console.log('flowCommand', command, cb)
    await dapps.add(command.input, {}, (err, res) => {
      if (err || res) console.log(err, res)
    })
    await dapps.launch(command.input, (err, res) => {
      if (err || res) console.log(err, res)
    })
  },
  addDapp (domain, options, cb) {
    if (!(domain.endsWith('.eth') || domain.endsWith('.xyz'))) domain += '.eth'
    // console.log('addDapp', domain, options, cb)
    dapps.add(domain, options, cb)
  },
  removeDapp (domain, cb) {
    dapps.remove(domain, cb)
  },
  moveDapp (fromArea, fromIndex, toArea, toIndex, cb) {
    dapps.move(fromArea, fromIndex, toArea, toIndex, cb)
  },
  launchDapp (domain, cb) {
    dapps.launch(domain, cb)
  },
  openDapp (domain, options, cb) {
    if (domain.endsWith('.eth')) {
      // console.log(' RPC openDapp ', domain, options, cb)
      dapps.add(domain, options, cb)
    } else {
      console.log('input needs to be ens name')
    }
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
    const args = [new Error('Unknown RPC method: ' + method)]
    event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
  }
})
