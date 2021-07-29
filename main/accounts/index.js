const EventEmitter = require('events')
const hdKey = require('hdkey')
const log = require('electron-log')
const publicKeyToAddress = require('ethereum-public-key-to-address')
const { shell, Notification } = require('electron')
const fetch = require('node-fetch')
const provider = require('eth-provider')

// const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')
const dataScanner = require('../externalData')

// Provider Proxy
const proxyProvider = require('../provider/proxy')

const Account = require('./Account')
const windows = require('../windows')

// const weiToGwei = v => Math.ceil(v / 1e9)
const gweiToWei = v => Math.ceil(v * 1e9)
const intToHex = v => '0x' + v.toString(16)
const hexToInt = v => parseInt(v, 'hex')
const weiHexToGweiInt = v => hexToInt(v) / 1e9
const weiIntToEthInt = v => v / 1e18
const gweiToWeiHex = v => intToHex(gweiToWei(v))

const notify = (title, body, action) => {
  const notification = { title, body }
  const note = new Notification(notification)
  note.on('click', action)
  setTimeout(() => note.show(), 1000)
}

const FEE_MAX = 2 * 1e18

class Accounts extends EventEmitter {
  constructor () {
    super()
    this._current = ''
    this.accounts = {}
    const stored = store('main.accounts')
    Object.keys(stored).forEach(id => {
      this.accounts[id] = new Account(JSON.parse(JSON.stringify(stored[id])), this)
    })

    dataScanner.start(Object.keys(this.accounts))
  }

  list () {
    return Object.keys(this.accounts).map(id => this.accounts[id].summary())
  }

  get (id) {
    return this.accounts[id].summary()
  }

  select (id) {
    // Set current account
  }

  closeAll () {
    // Close all accounts
  }

  seedToAddresses (seed) {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex'))
    const addresses = []
    for (let i = 0; i < 100; i++) {
      const publicKey = wallet.derive('m/44\'/60\'/0\'/0/' + i).publicKey
      const address = publicKeyToAddress(publicKey)
      addresses.push(address)
    }
    return addresses
  }

  fingerprint (network, addresses) {
    return crypt.stringToKey(network + addresses.join()).toString('hex')
  }

  // Public
  addAragon (account, cb = () => {}) {
    // if (account.addresses.length === 0) return cb(new Error('No addresses, will not add account'))
    // account.network = account.network || store('main.currentNetwork.id')
    // account.id = this.fingerprint(account.network, account.addresses)
    account.options = account.options || {}
    const existing = store('main.accounts', account.address)
    if (existing) return cb(null, existing) // Account already exists...
    log.info('Aragon account not found, creating account')
    account.options.type = 'aragon'
    this.accounts[account.address] = new Account(account, this)
    cb(null, this.accounts[account.address].summary())
  }

  async add (address = '', options = {}, cb = () => {}) {
    if (!address) return cb(new Error('No address, will not add account'))
    address = address.toLowerCase()
    const account = store('main.accounts', address)
    if (account) return cb(null, account) // Account already exists...
    log.info('Account not found, creating account')
    const created = 'new:' + Date.now()
    this.accounts[address] = new Account({ address, created, options }, this)
  }

  // async getMainnetBlockHeight (cb) {
  //   let blockNumber = -1
  //   try {
  //     blockNumber = await mainnetProvider.request({ method: 'eth_blockNumber' })
  //   } catch (e) {
  //     log.err(e)
  //   }
  //   return blockNumber
  // }

  rename (id, name) { this.accounts[id].rename(name) }

  update (account, add) {
    store.updateAccount(account, add)
  }

  current () {
    return this.accounts[this._current]
  }

  updateNonce (reqId, nonce) {
    log.info('Update Nonce: ', reqId, nonce)

    const currentAccount = this.current()
    const req = currentAccount.requests[reqId]
    if (req.type === 'transaction') req.data.nonce = nonce
    currentAccount.update()
    return req
  }

  removeRequestWarning (reqId) {
    log.info('removeRequestWarning: ', reqId)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[reqId]) {
      delete currentAccount.requests[reqId].warning
      currentAccount.update()
    }
  }

  checkBetterGasPrice(targetChain) {
    const { id, type } = targetChain
    const gas = store('main.networksMeta', type, id, 'gas.price')
    const currentAccount = this.current()

    if (gas && currentAccount && gas.selected !== 'custom') {
      Object.keys(currentAccount.requests).forEach(id => {
        const req = currentAccount.requests[id]
        if (req.type === 'transaction' && req.data.gasPrice) {
          const setPrice = weiHexToGweiInt(req.data.gasPrice)
          const currentPrice = weiHexToGweiInt(gas.levels[gas.selected])
          if (isNaN(setPrice) || isNaN(currentPrice)) return
          if (currentPrice < setPrice) {
            req.data.gasPrice = gweiToWeiHex(currentPrice)
            currentAccount.update()
          }
        }
      })
    }
  }

  async replaceTx (id, type) {
    const currentAccount = this.current()
    return new Promise((resolve, reject) => {
      if (!currentAccount || !currentAccount.requests[id]) return reject(new Error('Could not find request'))
      if (currentAccount.requests[id].type !== 'transaction') return reject(new Error('Request is not transaction'))

      const data = JSON.parse(JSON.stringify(currentAccount.requests[id].data))
      const targetChain = { type: 'ethereum', id: parseInt(data.chainId, 'hex').toString()}
      const { levels } = store('main.networksMeta', targetChain.type, targetChain.id, 'gas.price')

      // Set the gas default to asap
      store.setGasDefault(targetChain.type, targetChain.id, 'asap', levels.asap)

      const tx = {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction'
      }

      if (type === 'speed') {
        tx.params = [data]
      } else {
        tx.params = [{
          from: currentAccount.getSelectedAddress(),
          to: currentAccount.getSelectedAddress(),
          value: '0x0',
          nonce: data.nonce,
          _origin: currentAccount.requests[id].origin
        }]
      }

      proxyProvider.emit('send', tx, (res = {}) => {
        if (res.error) return reject(new Error(res.error))
        resolve()
      }, targetChain)
    })
  }

  async confirmations (account, id, hash, targetChain) {
    return new Promise((resolve, reject) => {
      // TODO: Route to account even if it's not current
      if (!account)  return reject(new Error('Unable to determine target account'))
      if (!targetChain || !targetChain.type || !targetChain.id) return reject(new Error('Unable to determine target chain'))
      proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_blockNumber', params: [] }, (res) => {
        if (res.error) return reject(new Error(JSON.stringify(res.error)))
        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [hash] }, receiptRes => {
          if (receiptRes.error) return reject(new Error(receiptRes.error))
          if (receiptRes.result && account.requests[id]) {
            account.requests[id].tx.receipt = receiptRes.result
            account.update()
            if (!account.requests[id].feeAtTime) {
              const network = targetChain
              if (network.type === 'ethereum' && network.id === '1') {
                fetch('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=KU5RZ9156Q51F592A93RUKHW1HDBBUPX9W').then(res => res.json()).then(res => {
                  if (res && res.message === 'OK' && res.result && res.result.ethusd) {
                    const { gasUsed } = account.requests[id].tx.receipt
                    const { gasPrice } = account.requests[id].data
                    account.requests[id].feeAtTime = (Math.round(weiIntToEthInt((hexToInt(gasUsed) * hexToInt(gasPrice)) * res.result.ethusd) * 100) / 100).toFixed(2)
                    account.update()
                  }
                }).catch(e => console.log('Unable to fetch exchange rate', e))
              } else {
                account.requests[id].feeAtTime = '?.??'
                account.update()
              }
            }
            if (receiptRes.result.status === '0x1' && account.requests[id].status === 'verifying') {
              account.requests[id].status = 'confirming'
              account.requests[id].notice = 'Confirming'
              account.requests[id].completed = Date.now()
              const { hash } = account.requests[id].tx
              const h = hash.substr(0, 6) + '...' + hash.substr(hash.length - 4)
              const body = `Transaction ${h} sucessful! \n Click for details`

              // Drop any other pending txs with same nonce
              Object.keys(account.requests).forEach(k => {
                const reqs = account.requests
                if (reqs[k].status === 'verifying' && reqs[k].data.nonce === reqs[id].data.nonce) {
                  account.requests[k].status = 'error'
                  account.requests[k].notice = 'Dropped'
                  setTimeout(() => this.accounts[account.address] && this.removeRequest(account, k), 8000)
                }
              })

              // If Frame is hidden, trigger native notification
              notify('Transaction Successful', body, () => {
                const { type, id } = targetChain
                const explorer = store('main.networks', type, id, 'explorer')
                shell.openExternal(explorer + '/tx/' + hash)
              })
            }
            const blockHeight = parseInt(res.result, 16)
            const receiptBlock = parseInt(account.requests[id].tx.receipt.blockNumber, 16)
            resolve(blockHeight - receiptBlock)
          }
        }, targetChain)
      }, targetChain)
    })
  }

  async txMonitor (account, id, hash) {

    if (!account) return log.error('txMonitor had no target account')

    account.requests[id].tx = { hash, confirmations: 0 }
    account.update()

    const rawTx = account.requests[id].data

    const targetChain = {
      type: 'ethereum',
      id: (rawTx && rawTx.chainId) ? parseInt(rawTx.chainId, 'hex') : undefined
    }

    if (!targetChain || !targetChain.type || !targetChain.id ) {
      log.error('txMonitor had no target chain')
      setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8 * 1000)
    } else {
      proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] }, newHeadRes => {
        if (newHeadRes.error) {
          log.warn(newHeadRes.error)
          const monitor = async () => {

            if (!account) return log.error('txMonitor internal monitor had no target account')

            let confirmations
            try {
              confirmations = await this.confirmations(account, id, hash, targetChain)
            } catch (e) {
              log.error('error awaiting confirmations', e)
              clearTimeout(monitorTimer)
              setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 60 * 1000)
              return
            }
            account.requests[id].tx.confirmations = confirmations
            account.update()
            if (confirmations > 12) {
              account.requests[id].status = 'confirmed'
              account.requests[id].notice = 'Confirmed'
              account.update()
              setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8000)
              clearTimeout(monitorTimer)
            }
          }
          setTimeout(() => monitor(), 3000)
          const monitorTimer = setInterval(monitor, 15000)
        } else if (newHeadRes.result) {
          const headSub = newHeadRes.result
          const handler = async payload => {
            if (payload.method === 'eth_subscription' && payload.params.subscription === headSub) {
              // const newHead = payload.params.result
              let confirmations
              try {
                confirmations = await this.confirmations(account, id, hash, targetChain)
              } catch (e) {
                log.error(e)
                // proxyProvider.removeListener('data', handler)
                proxyProvider.off(`data:${targetChain.type}:${targetChain.id}`, handler)
                setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 60 * 1000)
                return
              }
              account.requests[id].tx.confirmations = confirmations
              account.update()
              if (confirmations > 12) {
                account.requests[id].status = 'confirmed'
                account.requests[id].notice = 'Confirmed'
                account.update()
                setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8000)
                // proxyProvider.removeListener('data', handler)
                
                proxyProvider.off(`data:${targetChain.type}:${targetChain.id}`, handler)
                proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_unsubscribe', params: [headSub] }, res => {
                  if (res.error) {
                    log.error('error sending message eth_unsubscribe', res)
                  }
                }, targetChain)
              }
            }
          }
          proxyProvider.on(`data:${targetChain.type}:${targetChain.id}`, handler)
        }
      }, targetChain)
    }
  }

  getSigners (cb) {
    const signerSummary = {}
    Object.keys(this.accounts).forEach(id => {
      const summary = this.accounts[id].summary()
      if (summary.status === 'Invalid sequence' || summary.status === 'initial') return
      signerSummary[id] = summary
    })
    cb(null, signerSummary)
  }

  // Set Current Account
  setSigner (id, cb) {
    const currentAccounts = this.current()
    this._current = id
    const summary = currentAccount.summary()
    cb(null, summary)
    windows.broadcast('main:action', 'setSigner', summary)
    if (currentAccount.status === 'ok') this.verifyAddress(false, (err, verified) => {
      if (!err && !verified) {
        currentAccount.signer = ''
        currentAccount.update()
      }
    })
  }

  unsetSigner (cb) {
    const s = this.current()
    this._current = null
    const summary = { id: '', status: '' }
    if (cb) cb(null, summary)
    windows.broadcast('main:action', 'unsetSigner', summary)
    // setTimeout(() => { // Clear signer requests when unset
    //   if (s) {
    //     s.requests = {}
    //     s.update()
    //   }
    // })
  }

  verifyAddress (display, cb) {
    const currentAddress = this.current()
    if (currentAccount && currentAccount.verifyAddress) currentAccount.verifyAddress(display, cb)
  }

  getSelectedAddresses () {
    return this.current() ? this.current().getSelectedAddresses() : []
  }

  getSelectedAddress () {
    return this.current() ? this.current().getSelectedAddress() : undefined
  }

  getAccounts (cb) {
    if (!this.current()) {
      if (cb) cb(new Error('No Account Selected'))
      return
    }
    return this.current().getAccounts(cb)
  }

  getCoinbase (cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().getCoinbase(cb)
  }

  signMessage (address, message, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== this.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))
    this.current().signMessage(message, cb)
  }

  signTypedData (address, typedData, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== this.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))
    this.current().signTypedData(typedData, cb)
  }

  signTransaction (rawTx, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    const matchSelected = rawTx.from.toLowerCase() === this.getSelectedAddress().toLowerCase()
    const matchActor = rawTx.from.toLowerCase() === (this.current().smart ? this.current().smart.actor.toLowerCase() : false)
    if (matchSelected || matchActor) {
      this.current().signTransaction(rawTx, cb)
    } else {
      cb(new Error('signMessage: Account does not match currently selected'))
    }
  }

  close () {
    dataScanner.kill()
    // usbDetect.stopMonitoring()
  }

  setSignerIndex (index, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().setIndex(index, cb)
  }

  setAccess (req, access) {
    if (this.current() && this.current().setAccess) {
      this.current().setAccess(req, access)
    }
  }

  addChain (req, added) {
    if (this.current() && this.current().addChain) {
      this.current().addChain(req, added)
    }
  }

  addRequest (req, res) {
    log.info('addRequest', JSON.stringify(req))
    if (!this.current() || this.current().requests[req.handlerId]) return // If no current signer or the request already exists
    this.current().addRequest(req, res)
  }

  removeRequest (account, handlerId) {
    log.debug(`removeRequest(${account.id}, ${handlerId})`)

    delete account.requests[handlerId]
    account.update()
  }

  declineRequest (handlerId) {
    const currentAccount = this.current()

    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = 'error'
      currentAccount.requests[handlerId].notice = 'Signature Declined'
      currentAccount.requests[handlerId].mode = 'monitor'
      setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 8000)
      currentAccount.update()
    }
  }

  setRequestPending (req) {
    const handlerId = req.handlerId
    const currentAccount = this.current()
    
    log.info('setRequestPending', handlerId)

    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = 'pending'
      currentAccount.requests[handlerId].notice = 'See Signer'
      currentAccount.update()
    }
  }

  setRequestError (handlerId, err) {
    log.info('setRequestError', handlerId)

    const currentAccount = this.current()

    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = 'error'
      if (err.message === 'Ledger device: Invalid data received (0x6a80)') {
        currentAccount.requests[handlerId].notice = 'Ledger Contract Data = No'
      } else if (err.message === 'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)') {
        currentAccount.requests[handlerId].notice = 'Ledger Signature Declined'
      } else {
        const notice = err && typeof err === 'string' ? err : err && typeof err === 'object' && err.message && typeof err.message === 'string' ? err.message : 'Unknown Error' // TODO: Update to normalize input type
        currentAccount.requests[handlerId].notice = notice
      }
      if (currentAccount.requests[handlerId].type === 'transaction') {
        setTimeout(() => {
          const activeAccount = this.current()
          if (activeAccount && activeAccount.requests[handlerId]) {
            activeAccount.requests[handlerId].mode = 'monitor'
            activeAccount.update()
            
            setTimeout(() => this.accounts[activeAccount.address] && this.removeRequest(activeAccount, handlerId), 8000)
          }
        }, 1500)
      } else {
        setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 3300)
      }

      currentAccount.update()
    }
  }

  setTxSigned (handlerId, cb) {
    log.info('setTxSigned', handlerId)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      if (currentAccount.requests[handlerId].status === 'declined' || currentAccount.requests[handlerId].status === 'error') {
        cb(new Error('Request already declined'))
      } else {
        currentAccount.requests[handlerId].status = 'sending'
        currentAccount.requests[handlerId].notice = 'Sending'
        currentAccount.update()
        cb()
      }
    } else {
      cb(new Error('No valid request for ' + handlerId))
    }
  }

  setTxSent (handlerId, hash) {
    log.info('setTxSent', handlerId, 'Hash', hash)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = 'verifying'
      currentAccount.requests[handlerId].notice = 'Verifying'
      currentAccount.requests[handlerId].mode = 'monitor'
      currentAccount.update()

      this.txMonitor(this.accounts[this._current], handlerId, hash)
    }
  }

  setRequestSuccess (handlerId) {
    log.info('setRequestSuccess', handlerId)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = 'success'
      currentAccount.requests[handlerId].notice = 'Successful'
      if (currentAccount.requests[handlerId].type === 'transaction') {
        tcurrentAccount.requests[handlerId].mode = 'monitor'
      } else {
        setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 3300)
      }

      currentAccount.update()
    }
  }

  remove (address = '') {
    address = address.toLowerCase()
    windows.broadcast('main:action', 'unsetSigner')
    if (this.accounts[address]) this.accounts[address].close()
    store.removeAccount(address)
    delete this.accounts[address]
  }

  invalidValue (fee) {
    return (!fee || isNaN(parseInt(fee, 'hex')) || parseInt(fee, 'hex') < 0)
  }

  setBaseFee (baseFee, handlerId, cb) {
    if (this.invalidValue(baseFee)) return cb(new Error('Invalid base fee'))

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      if (parseInt(baseFee, 'hex') > 9999 * 1e9) baseFee = '0x' + (9999 * 1e9).toString(16)

      const priorityFee = this.current().requests[handlerId].data.maxPriorityFeePerGas
      const gasLimit = this.current().requests[handlerId].data.gasLimit

      const limit = parseInt(gasLimit, 'hex')

      let fee = parseInt(baseFee, 'hex') + parseInt(priorityFee, 'hex')
      if (fee * limit > FEE_MAX) {
        log.warn('Operation would set fee over hard limit')
        fee = '0x' + (Math.floor(FEE_MAX / limit)).toString(16)
      } else {
        fee = '0x' + fee.toString(16)
      }
      
      this.current().requests[handlerId].data.maxFeePerGas = fee
      this.current().update()
      cb()
    }
  }

  setPriorityFee (priorityFee, handlerId, cb) {
    if (this.invalidValue(priorityFee)) return cb(new Error('Invalid priority fee'))
    if (!this.current()) return
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      if (parseInt(priorityFee, 'hex') > 9999 * 1e9) priorityFee = '0x' + (9999 * 1e9).toString(16)
      
      const maxFeePerGas = parseInt(this.current().requests[handlerId].data.maxFeePerGas, 'hex')
      const gasLimit = parseInt(this.current().requests[handlerId].data.gasLimit, 'hex')
      const maxPriorityFeePerGas = parseInt(this.current().requests[handlerId].data.maxPriorityFeePerGas, 'hex')
      const baseFee = maxFeePerGas - maxPriorityFeePerGas

      const newMaxPriorityFeePerGas = parseInt(priorityFee, 'hex')
      const newMaxFeePerGas = baseFee + newMaxPriorityFeePerGas
  
      if (newMaxFeePerGas * gasLimit > FEE_MAX) {
        log.warn('Operation would set fee over hard limit')
        const limitedMaxPriorityFeePerGas = Math.floor(FEE_MAX / gasLimit) - baseFee
        const limitedMaxFeePerGas = baseFee + limitedMaxPriorityFeePerGas
        this.current().requests[handlerId].data.maxPriorityFeePerGas = '0x' + limitedMaxPriorityFeePerGas.toString(16)
        this.current().requests[handlerId].data.maxFeePerGas = '0x' + limitedMaxFeePerGas.toString(16)
      } else {
        this.current().requests[handlerId].data.maxFeePerGas = '0x' + newMaxFeePerGas.toString(16)
        this.current().requests[handlerId].data.maxPriorityFeePerGas = '0x' + newMaxPriorityFeePerGas.toString(16)
      }

      this.current().update()
      cb()
    }
  }

  setGasPrice (gasPrice, handlerId, cb) {
    if (this.invalidValue(gasPrice)) return cb(new Error('Invalid gas price'))
    if (!this.current()) return
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      if (parseInt(gasPrice, 'hex') > 9999 * 1e9) gasPrice = '0x' + (9999 * 1e9).toString(16)
      const gasLimit = this.current().requests[handlerId].data.gasLimit
      const fee = parseInt(gasPrice, 'hex')
      const limit = parseInt(gasLimit, 'hex')
      if (fee * limit > FEE_MAX) {
        log.warn('Operation would set fee over hard limit')
        gasPrice = '0x' + Math.floor(FEE_MAX / limit)
      }
      this.current().requests[handlerId].data.gasPrice = gasPrice
      this.current().update()
      cb()
    }
  }

  setGasLimit (limit, handlerId, cb) {
    if (this.invalidValue(limit)) return cb(new Error('Invalid gas limit'))
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      limit = parseInt(limit, 'hex') 
      if (limit > 12.5e6) limit = 12.5e6
      const { type, maxFeePerGas, maxPriorityFeePerGas, gasPrice } = this.current().requests[handlerId].data
      const fee = type === '0x2' ? parseInt(maxFeePerGas, 'hex') + parseInt(maxPriorityFeePerGas, 'hex') : parseInt(gasPrice, 'hex')
      if (limit * fee > FEE_MAX) {
        log.warn('setGasLimit operation would set fee over hard limit')
        limit = '0x' + Math.floor(FEE_MAX / fee).toString(16)
      } else {
        limit = '0x' + limit.toString(16)
      }
      this.current().requests[handlerId].data.gasLimit = limit
      this.current().update()
      cb()
    }
  }

  adjustNonce (handlerId, nonceAdjust) {
    const currentAccount = this.current()

    if (nonceAdjust !== 1 && nonceAdjust !== -1) return log.error('Invalid nonce adjustment', nonceAdjust)
    if (!currentAccount) return log.error('No account selected during nonce adjustement', nonceAdjust)

    if (currentAccount.requests[handlerId] && currentAccount.requests[handlerId].type === 'transaction') {
      const nonce = currentAccount.requests[handlerId].data && currentAccount.requests[handlerId].data.nonce
      if (nonce) {
        const adjustedNonce = '0x' + (parseInt(nonce, 'hex') + nonceAdjust).toString(16)
        currentAccount.requests[handlerId].data.nonce = adjustedNonce
        currentAccount.update()
      } else {
        const { from, chainId } = currentAccount.requests[handlerId].data

        const targetChain = { type: 'ethereum', id: parseInt(chainId, 'hex').toString() }

        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'pending'] }, (res) => {
          if (res.result) {
            const newNonce = parseInt(res.result, 'hex')
            const adjustedNonce = '0x' + (nonceAdjust === 1 ? newNonce : newNonce + nonceAdjust).toString(16)
            currentAccount.requests[handlerId].data.nonce = adjustedNonce
            currentAccount.update()
          }
        }, targetChain)
      }
    }
  }

  scanSelectedAddress () {
    dataScanner.setActiveAddress(this.getSelectedAddress())
  }

  stopExternalDataScan () {
    dataScanner.stop()
  }

  // removeAllAccounts () {
  //   windows.broadcast('main:action', 'unsetSigner')
  //   setTimeout(() => {
  //     Object.keys(this.accounts).forEach(id => {
  //       if (this.accounts[id]) this.accounts[id].close()
  //       store.removeAccount(id)
  //       delete this.accounts[id]
  //     })
  //   }, 1000)
  // }
}

module.exports = new Accounts()
