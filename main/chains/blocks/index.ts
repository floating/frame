import { EventEmitter } from 'events'
import { JSONRPCRequestPayload, AbstractBlock } from 'ethereum-protocol'

interface Connection {
  send (payload: JSONRPCRequestPayload): Promise<any>,
  on: (event: string, handler: any) => void,
  off: (event: string, handler: any) => void
}

interface SubscriptionMessage {
  type: 'eth_subscription',
  data: {
    subscription: string,
    result: Block
  }
}

type Block = AbstractBlock & {
  number: string
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

    this.connection.on('connect', () => {
      console.log('connected!')
      this.start()
    })
    this.connection.on('close', this.stop)
  }

  start () {
    this.connection.on('message', this.handleMessage)

    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] })
      .then(subId => this.subscriptionId = subId)
      .catch(err => {
        // subscriptions are not supported, poll for block changes instead
        this._clearSubscription()
        
        this.getLatestBlock()
        this.poller = setInterval(this.getLatestBlock, 15 * 1000)
      })
  }

  stop () {
    if (this.subscriptionId) {
      this._clearSubscription()
    }

    if (this.poller) {
      this._stopPoller()
    }
  }

  _clearSubscription () {
    this.connection.off('message', this.handleMessage)
    this.subscriptionId = ''
  }

  _stopPoller () {
    clearInterval(<NodeJS.Timeout>this.poller)
    this.poller = undefined
  }

  getLatestBlock () {
    this.connection
      .send({ id: 1, jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: ['latest', false] })
      .then(this.handleBlock)
      .catch(err => {
        console.error(`could not load latest block`, err)
      })
  }

  handleMessage (message: SubscriptionMessage) {
    if (message.type === 'eth_subscription' && message.data.subscription === this.subscriptionId) {
      this.handleBlock(message.data.result)
    }
  }

  handleBlock (block: Block) {
    if (block.number !== this.latestBlock) {
      this.latestBlock = block.number
      this.emit('data', block)
    }
  }
}

export default BlockMonitor
