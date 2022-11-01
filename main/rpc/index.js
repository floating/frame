const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const utils = require('web3-utils')
const { randomBytes } = require('crypto')

const accounts = require('../accounts').default
const signers = require('../signers').default
const launch = require('../launch')
const provider = require('../provider').default
const store = require('../store').default
const dapps = require('../dapps')
// const ens = require('../ens')
// const ipfs = require('../ipfs')

const { resolveName } = require('../accounts/aragon')
const { arraysEqual, randomLetters } = require('../../resources/utils')
const { default: TrezorBridge } = require('../../main/signers/trezor/bridge')

const callbackWhenDone = (fn, cb) => {
  try {
    fn()
    cb(null)
  } catch (e) {
    cb (e)
  }
}

const rpc = {
  getState: cb => {
    cb(null, store())
  },
  getFrameId (window, cb) {
    if (window.frameId) {
      cb(null, window.frameId)
    } else {
      cb(new Error('No frameId set for this window'))
    }
  },
  signTransaction: accounts.signTransaction,
  signMessage: accounts.signMessage,
  getAccounts: accounts.getAccounts,
  getCoinbase: accounts.getCoinbase,
  // Review
  // getSigners: signers.getSigners,
  setSigner: (id, cb) => {
    const previousAddresses = accounts.getSelectedAddresses()

    accounts.setSigner(id, cb)

    const currentAddresses = accounts.getSelectedAddresses()

    if (!arraysEqual(previousAddresses, currentAddresses)) {
      provider.accountsChanged(currentAddresses)
    }
  },
  // setSignerIndex: (index, cb) => {
  //   accounts.setSignerIndex(index, cb)
  //   provider.accountsChanged(accounts.getSelectedAddresses())
  //   setTimeout(() => {
  //     accounts.balanceScan()
  //   }, 320)
  // },
  unsetSigner: (id, cb) => {
    const previousAddresses = accounts.getSelectedAddresses()

    accounts.unsetSigner(cb)

    const currentAddresses = accounts.getSelectedAddresses()

    if (!arraysEqual(previousAddresses, currentAddresses)) {
      provider.accountsChanged(currentAddresses)
    }
  },
  // setSignerIndex: signers.setSignerIndex,
  // unsetSigner: signers.unsetSigner,
  trezorPin: (id, pin, cb) => {
    cb()
    TrezorBridge.pinEntered(id, pin)
  },
  trezorPhrase: (id, phrase, cb) => {
    cb()
    TrezorBridge.passphraseEntered(id, phrase)
  },
  trezorEnterPhrase: (id, cb) => {
    cb()
    TrezorBridge.enterPassphraseOnDevice(id)
  },
  createLattice: (deviceId, deviceName, cb) => {
    if (!deviceId) {
      return cb(new Error('No Device ID'))
    }

    store.updateLattice(deviceId, {
      deviceId, 
      baseUrl: 'https://signing.gridpl.us',
      endpointMode: 'default',
      paired: true,
      deviceName: (deviceName || 'GridPlus').substring(0, 14),
      tag: randomLetters(6),
      privKey: randomBytes(32).toString('hex')  
    })

    cb(null, { id: 'lattice-' + deviceId })
  },
  async latticePair (id, pin, cb) {
    const signer = signers.get(id)

    if (signer && signer.pair) {
      try {
        const hasActiveWallet = await signer.pair(pin)
        cb(null, hasActiveWallet)
      } catch (e) {
        cb(e.message)
      }
    }
  },
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
  updateRequest (req, actionId, data, cb) {
    accounts.updateRequest(req.handlerId, actionId, data)
  },
  approveRequest (req, cb) {
    accounts.setRequestPending(req)
    if (req.type === 'transaction') {
      provider.approveTransactionRequest(req, (err, res) => {
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
  addAragon (account, cb) {
    accounts.addAragon(account, cb)
  },
  createFromAddress (address, name, cb) {
    if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.add(address, name, { type: 'Address' })
    cb()
  },
  createAccount (address, name, options, cb) {
    if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.add(address, name, options)
    cb()
  },
  removeAccount (address, options, cb) {
    // if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.remove(address)
    cb()
  },
  createFromPhrase (phrase, password, cb) {
    signers.createFromPhrase(phrase, password, cb)
  },
  locateKeystore (cb) {
    dialog.showOpenDialog({ properties: ['openFile'] }).then(file => {
      const keystore = file || { filePaths: [] }
      if ((keystore.filePaths || []).length > 0) {
        fs.readFile(keystore.filePaths[0], 'utf8', (err, data) => {
          if (err) return cb(err)
          try { cb(null, JSON.parse(data)) } catch (err) { cb(err) }
        })
      } else {
        cb(new Error('No Keystore Found'))
      }
    }).catch(cb)
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
  remove (id) {
    signers.remove(id)
  },
  resolveAragonName (name, chainId, cb) {
    resolveName(name, chainId).then(result => cb(null, result)).catch(cb)
  },
  verifyAddress (cb) {
    const res = (err, data) => cb(err, data || false)
    accounts.verifyAddress(true, res)
  },
  setBaseFee (fee, handlerId, cb) {
    callbackWhenDone(() => accounts.setBaseFee(fee, handlerId, true), cb)
  },
  setPriorityFee (fee, handlerId, cb) {
    callbackWhenDone(() => accounts.setPriorityFee(fee, handlerId, true), cb)
  },
  setGasPrice (price,handlerId, cb) {
    callbackWhenDone(() => accounts.setGasPrice(price, handlerId, true), cb)
  },
  setGasLimit (limit, handlerId, cb) {
    callbackWhenDone(() => accounts.setGasLimit(limit, handlerId, true), cb)
  },
  removeFeeUpdateNotice (handlerId, cb) {
    accounts.removeFeeUpdateNotice(handlerId, cb)
  },
  signerCompatibility (handlerId, cb) {
    accounts.signerCompatibility(handlerId, cb)
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
    if (method === 'getFrameId') {
      rpc[method](event.sender.getOwnerBrowserWindow(), ...args, (...args) => {
        event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
      })
    } else {
      rpc[method](...args, (...args) => {
        event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
      })
    }
  } else {
    const args = [new Error('Unknown RPC method: ' + method)]
    event.sender.send('main:rpc', id, ...args.map(arg => arg instanceof Error ? wrap(arg.message) : wrap(arg)))
  }
})
