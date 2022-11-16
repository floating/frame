import { EventEmitter } from 'events'
import log from 'electron-log'

import type { BigNumber } from 'bignumber.js'

interface Connection extends EventEmitter {
  send (payload: JSONRPCRequestPayload): Promise<any>
  chainId: string
}

interface SubscriptionMessage {
  type: 'eth_subscription'
  data: {
    subscription: string
    result: Block
  }
}

interface Block {
  number: string
  hash: string | null
  parentHash: string
  nonce: string | null
  sha3Uncles: string
  logsBloom: string | null
  transactionsRoot: string
  stateRoot: string
  miner: string
  difficulty: BigNumber
  totalDifficulty: BigNumber
  extraData: string
  size: number
  gasLimit: number
  gasUsed: number
  timestamp: number
  uncles: string[]
}

class BlockMonitor extends EventEmitter {
  private connection: Connection
  private subscriptionId: string
  private poller: NodeJS.Timeout | undefined

  latestBlock: string

  constructor (connection: Connection) {
    super()

    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleBlock = this.handleBlock.bind(this)
    this.getLatestBlock = this.getLatestBlock.bind(this)

    this.connection = connection
    this.subscriptionId = ''

    this.latestBlock = '0x0'

    this.connection.once('connect', this.start)
    this.connection.once('close', this.stop)
  }

  start () {
    this.connection.on('message', this.handleMessage)

    // load the latest block first on connect, then start checking for new blocks
    this.getLatestBlock()

    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] })
      .then(subId => this.subscriptionId = subId)
      .catch(err => {
        // subscriptions are not supported, poll for block changes instead
        this.clearSubscription()
        
        this.poller = setInterval(this.getLatestBlock, 15 * 1000)
      })
  }

  stop () {
    this.removeAllListeners()
    this.connection.off('connect', this.start)
    this.connection.off('close', this.stop)

    if (this.subscriptionId) {
      this.clearSubscription()
    }

    if (this.poller) {
      this.stopPoller()
    }
  }

  private clearSubscription () {
    this.connection.off('message', this.handleMessage)
    this.subscriptionId = ''
  }

  private stopPoller () {
    clearInterval(<NodeJS.Timeout>this.poller)
    this.poller = undefined
  }

  private getLatestBlock () {
    this.connection
      .send({ id: 1, jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: ['latest', false] })
      .then(block => this.handleBlock(block))
      .catch(err => this.handleError(`Could not load block for chain ${this.connection.chainId}`, err))
  }

  private handleMessage (message: SubscriptionMessage) {
    if (message.type === 'eth_subscription' && message.data.subscription === this.subscriptionId) {
      this.handleBlock(message.data.result)
    }
  }

  private handleBlock (block: Block) {
    if (!block) return this.handleError('handleBlock received undefined block')

    if (block.number !== this.latestBlock) {
      this.latestBlock = block.number
      this.connection.emit('status', 'connected')
      this.emit('data', block)
    }
  }

  private handleError (...args: any) {
    this.connection.emit('status', 'degraded')
    log.error(...args)
  }
}

export default BlockMonitor
