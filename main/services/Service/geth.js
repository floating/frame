const Service = require('./index')
const { execFile } = require('child_process')
const axios = require('axios')
const store = require('../../store')
const { hexToNumber } = require('web3-utils')

const SYNC_CHECK_INTERVAL = 3000

class Geth extends Service {
  constructor() {
    super('geth')
    // this.on('stdout', console.log)
    // this.on('stderr', console.error)
    // this.on('serror', console.error)
    this.ws = null
    this.syncCheckInterval = null
  }

  start () {
    this.on('ready', () => {
      // Start client
      this._startClient()
      // Check if syncing every <INTERVAL>
      this.syncCheckInterval = setInterval(() => this._syncCheck(), SYNC_CHECK_INTERVAL);
    })
    this.init()
  }

  stop () {
    // Clear sync check interval
    clearInterval(this.syncCheckInterval)
    // Update state on close
    this.once('close', (code) => store.setClientState('geth', 'off'))
    // Send 'SIGTERM' to client process
    this.process.kill()
  }

  _startClient () {
    // Get config values
    const { mode, networkId } = store('main.clients.geth')
    const networkFlag = this._getNetworkFlag(networkId)
        
    // Prepare client arguments
    let args = ['--networkid', networkId, '--syncmode', mode, '--nousb', '--rpc']
    if (networkFlag) args.push(networkFlag)

    // Start client
    this._run(args)
  }

  async _syncCheck () {
    let state

    // Check using JSON RPC method 'eth_blockNumber'
    if (await this._getBlockNumber() === 0) state = 'syncing'
    
    // Check using JSON RPC method 'eth_syncing'
    else state = await this._isSyncing() ? 'syncing' : 'ready'
    
    // If state has changed -> update client state
    if (state !== store('main.clients.geth.state')) {
      store.setClientState('geth', state)
    }

    console.log("sync check:", state)
  }

  async _isSyncing () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'eth_syncing', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)

    // Get sync status
    return res.data.result !== false
  }

  async _getBlockNumber () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)
    
    // Return block number as integer
    return hexToNumber(res.data.result)
  }

  _getNetworkFlag (id) {
    if (id === '1') return null
    if (id === '3') return '--testnet'
    if (id === '4') return '--rinkeby'
  }

}

module.exports = new Geth()
