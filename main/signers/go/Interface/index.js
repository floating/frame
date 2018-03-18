const path = require('path')
const { spawn } = require('child_process')
const net = require('net')
const IPCProvider = require('web3-providers-ipc')
const Signer = require('../../Signer')

let goSigner = path.resolve(__dirname, '../../../../node_modules/.bin/signer')
let args = ['-stdio-ui', '-4bytedb', path.resolve(__dirname, './4byte.json')]
let ipcPath = path.resolve(__dirname, '../../../../../../Library/Signer/signer.ipc')

class Interface extends Signer {
  constructor (id) {
    super()
    this.id = id
    this.type = 'Go'
    this.status = 'loading'
    this.handlers = {}
    this.signer = spawn(goSigner, args)
    this.signer.stdout.on('data', this.onData.bind(this))
    this.signer.stderr.on('data', this.onError.bind(this))
    this.provider = new IPCProvider(ipcPath, net)
    this.open()
  }
  onData (buffer) {
    let dataString = this.incomplete ? this.incomplete.concat(buffer.toString()) : buffer.toString()
    try {
      var data = JSON.parse(dataString)
      this.incomplete = null
    } catch (e) {
      this.incomplete = (this.incomplete || '') + dataString
      return
    }
    console.log('Signer Data: ', data)
    if (data.method === 'OnSignerStartup') return this.onStartup(data)
    if (data.method === 'ShowError') return this.showError(data)
    if (data.method === 'ApproveTx') return this.approveTx(data)
    if (data.method === 'ApproveNewAccount') return this.approveNewAccount(data)
    if (data.method === 'ApproveListing') return this.approveListing(data)
    if (data.method === 'OnApprovedTx') return this.onApprovedTx(data)
  }
  onError (data) {
    console.log('Error:', data.toString())
  }
  onApprovedTx (data) {
    if (this.handlers.currentTx.cb) this.handlers.currentTx.cb(null, data.params[0].raw)
  }
  approveNewAccount (data) {
    const confirm = {
      id: data.id,
      jsonrpc: '2.0',
      result: {approved: true, password: '123'}
    }
    this.signer.stdin.write(JSON.stringify(confirm))
  }
  approveListing (data) {
    const confirm = {
      id: data.id,
      jsonrpc: '2.0',
      result: {approved: true, accounts: data.params[0].accounts, password: '123'}
    }
    this.signer.stdin.write(JSON.stringify(confirm))
  }
  newAccount () {
    let req = {id: 1, jsonrpc: '2.0', method: 'account_new', params: []}
    this.provider.send(req, (err, res) => console.log(err, res))
  }
  setAccountList () {
    this.provider.send({id: 1, jsonrpc: '2.0', method: 'account_list'}, (err, res) => {
      err = res.error || err
      if (err) return console.log(err)
      this.accounts = res.result.map(account => account.address)
      this.status = 'ok'
      this.update()
    })
  }
  onStartup (data) {
    this.setAccountList()
  }
  showError (data) {
    this.handlers.currentTx.send('main:requestError', this.handlers.currentTx.reqId, data.params[0].text)
  }
  supplyPassword (password) {
    if (!this.handlers.currentTx) return console.log('No handler for supplied password.')
    let data = this.handlers.currentTx.data
    const confirm = {
      id: data.id,
      jsonrpc: '2.0',
      result: {
        approved: true,
        transaction: data.params[0].transaction,
        from: data.params[0].from,
        password
      }
    }
    this.signer.stdin.write(JSON.stringify(confirm))
  }
  approveTx (data) {
    if (!this.handlers.currentTx) return console.log('No handler for ApproveTx')
    this.handlers.currentTx.data = data
    this.handlers.currentTx.send('main:supplyPassword', this.handlers.currentTx.reqId)
  }
  // Standard Methods
  signTransaction (rawTx, cb, send, reqId) {
    const req = {
      id: 1,
      jsonrpc: '2.0',
      method: 'account_signTransaction',
      params: [rawTx]
    }
    this.handlers.currentTx = {rawTx, cb, send, reqId}
    this.provider.send(req, (err, res) => console.log(err))
  }
}

module.exports = Interface
