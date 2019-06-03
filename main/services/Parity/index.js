const Client = require('../Client')
const axios = require('axios')
const log = require('electron-log')
const store = require('../../store')
const fs = require('fs')
const { hexToNumber } = require('web3-utils')

const SYNC_CHECK_INTERVAL = 3000

class Parity extends Client {
  constructor (options) {
    super('parity', options)
    this.syncCheckInterval = null
    this.initialBlockNumber = store('main.clients.parity.blockNumber')

    // On ready -> start client
    this.on('ready', () => {
      // Get client mode and current network id
      const networkId = store('main.connection.network')
      const chain = this._getChain(networkId)

      // Make sure parity is executable
      fs.chmodSync(this.bin, 755)

      // Prepare client arguments
      let args = ['--chain', chain, '--light']

      // Start client
      this._run(args)

      // Check if syncing every <INTERVAL>
      this.syncCheckInterval = setInterval(() => this._syncCheck(), SYNC_CHECK_INTERVAL)
    })
  }

  start () {
    // Ensure client isn't already running
    if (store('main.clients.parity.state') !== 'off') return

    // Start client
    this._start()
  }

  stop () {
    // Ensure state is 'ready' or 'syncing'
    const state = store('main.clients.parity.state')
    if (!(state === 'ready' || state === 'syncing')) return

    // Terminate service
    this._stop()

    // Clear sync check interval
    clearInterval(this.syncCheckInterval)
  }

  async _syncCheck () {
    let state

    // Get blocknumber and update store
    let blockNumber = await this._getBlockNumber()
    store.updateClient('parity', 'blockNumber', blockNumber)

    // Check using JSON RPC method 'eth_blockNumber'
    if (blockNumber === 0) state = 'syncing'

    // Check if block number has changed since last time Frame was running
    else if (blockNumber === this.initialBlockNumber) state = 'syncing'

    // Check using JSON RPC method 'net_peerCount'
    else if (await this._getPeerCount() === 0) state = 'syncing'

    // Check using JSON RPC method 'eth_syncing'
    else state = await this._isSyncing() ? 'syncing' : 'ready'

    // If state has changed -> log and emit new state
    if (state !== store('main.clients.parity.state')) {
      log.info('parity:', state)
      this.emit('state', state)
    }
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

  async _getPeerCount () {
    // RPC message
    const message = { jsonrpc: '2.0', id: 1, method: 'net_peerCount', params: [] }

    // Make HTTP request
    const res = await axios.post('http://127.0.0.1:8545', message)

    // Return block number as integer
    return hexToNumber(res.data.result)
  }

  _getChain (networkId) {
    if (networkId === '1') return 'mainnet'
    if (networkId === '3') return 'ropsten'
    if (networkId === '4') return 'rinkeby'
  }
}

module.exports = new Parity()
