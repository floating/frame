const Client = require('../Client')
const axios = require('axios')
const log = require('electron-log')
const store = require('../../store')
const { hexToNumber } = require('web3-utils')

const SYNC_CHECK_INTERVAL = 3000

class EthereumClient extends Client {
  constructor (name, options) {
    super(name, options)
    this.syncCheckInterval = null
    this.initialBlockNumber = store(`main.clients.${this.name}.blockNumber`)

    // On ready -> check sync status once and then every <SYNC_CHECK_INTERVAL>
    this.on('ready', () => {
      setTimeout(() => this._syncCheck(), 500)
      this.syncCheckInterval = setInterval(() => this._syncCheck(), SYNC_CHECK_INTERVAL)
    })
  }

  stop () {
    // Terminate service
    super.stop()

    // Clear sync check interval
    clearInterval(this.syncCheckInterval)
  }

  async _syncCheck () {
    let state

    // Get blocknumber and update store
    let blockNumber = await this._getBlockNumber()
    store.updateClient(this.name, 'blockNumber', blockNumber)

    // Check using JSON RPC method 'eth_blockNumber'
    if (blockNumber === 0) state = 'syncing'

    // Check if block number has changed since last time Frame was running
    else if (blockNumber === this.initialBlockNumber) state = 'syncing'

    // Check using JSON RPC method 'net_peerCount'
    else if (await this._getPeerCount() === 0) state = 'syncing'

    // Check using JSON RPC method 'eth_syncing'
    else {
      const result = await this._isSyncing()
      if (!result) {
        state = 'ready'
      } else {
        store.updateClient(this.name, 'currentBlock', hexToNumber(result.currentBlock))
        store.updateClient(this.name, 'highestBlock', hexToNumber(result.highestBlock))
        state = 'syncing'
      }
    }

    // If state has changed -> log and emit new state
    if (state !== store(`main.clients.${this.name}.state`)) {
      log.info(`${this.name}:`, state)
      this.emit('state', state)
    }
  }

  async _isSyncing () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'eth_syncing', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)

    // Get sync status
    return res.data.result
  }

  async _getBlockNumber () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)

    // Return block number as integer
    return hexToNumber(res.data.result)
  }

  async _getPeerCount () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'net_peerCount', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)

    // Return block number as integer
    return hexToNumber(res.data.result)
  }
}

module.exports = EthereumClient
