import { EventEmitter } from 'events'
import log from 'electron-log'

import type { BigNumber } from 'bignumber.js'

interface Connection extends EventEmitter {
  send(payload: JSONRPCRequestPayload): Promise<any>
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

  constructor(connection: Connection) {
    super()

    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleBlock = this.handleBlock.bind(this)
    this.getLatestBlock = this.getLatestBlock.bind(this)

    this.connection = connection
    this.subscriptionId = ''

    this.latestBlock = '0x0'

    this.connection.on('connect', this.start)
    this.connection.on('close', this.stop)
  }

  start() {
    log.verbose(`%cStarting block updates for chain ${this.chainId}`, 'color: green')

    this.connection.on('message', this.handleMessage)

    // load the latest block first on connect, then start checking for new blocks
    this.getLatestBlock()

    this.connection
      .send({ id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] })
      .then((subId) => (this.subscriptionId = subId))
      .catch(() => {
        // subscriptions are not supported, poll for block changes instead
        this.clearSubscription()

        this.poller = setInterval(this.getLatestBlock, 15 * 1000)
      })
  }

  stop() {
    log.verbose(`%cStopping block updates for chain ${this.chainId}`, 'color: red')

    if (this.subscriptionId) {
      this.clearSubscription()
    }

    if (this.poller) {
      this.stopPoller()
    }
  }

  get chainId() {
    return parseInt(this.connection.chainId, 16)
  }

  private clearSubscription() {
    this.connection.off('message', this.handleMessage)
    this.subscriptionId = ''
  }

  private stopPoller() {
    clearInterval(<NodeJS.Timeout>this.poller)
    this.poller = undefined
  }

  private getLatestBlock() {
    this.connection
      .send({ id: 1, jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: ['latest', false] })
      .then((block) => this.handleBlock(block))
      .catch((err) => this.handleError(`Could not load block for chain ${this.chainId}`, err))
  }

  private handleMessage(message: SubscriptionMessage) {
    if (message.type === 'eth_subscription' && message.data.subscription === this.subscriptionId) {
      this.handleBlock(message.data.result)
    }
  }

  private handleBlock(blockUpdate: unknown) {
    if (!blockUpdate || typeof blockUpdate !== 'object') {
      return this.handleError(`Received invalid block on chain ${this.chainId}`)
    }

    const block = blockUpdate as Block

    log.debug(`%cReceived block ${parseInt(block.number)} for chain ${this.chainId}`, 'color: yellow', {
      latestBlock: parseInt(this.latestBlock)
    })

    if (block.number !== this.latestBlock) {
      this.latestBlock = block.number
      this.connection.emit('status', 'connected')
      this.emit('data', block)
    }
  }

  private handleError(...args: any) {
    this.connection.emit('status', 'degraded')
    log.error(...args)
  }
}

export default BlockMonitor
