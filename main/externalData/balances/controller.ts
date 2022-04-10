import log from 'electron-log'
import { ChildProcess, fork } from 'child_process'

import { CurrencyBalance, TokenBalance } from './scan'
import path from 'path'
import { EventEmitter } from 'stream'

interface WorkerMessage {
  type: string,
  [key: string]: any
}

interface TokenBalanceMessage extends Omit<WorkerMessage, 'type'> {
  type: 'tokenBalances',
  address: Address,
  balances: TokenBalance[]
}

interface ChainBalanceMessage extends Omit<WorkerMessage, 'type'> {
  type: 'chainBalances',
  address: Address,
  balances: CurrencyBalance[]
}

export default class BalancesWorkerController extends EventEmitter {
  private readonly worker: ChildProcess

  private heartbeat?: NodeJS.Timeout

  constructor () {
    super()
  
    const workerArgs = process.env.NODE_ENV === 'development' ? ['--inspect=127.0.0.1:9230'] : []
    this.worker = fork(path.resolve(__dirname, 'worker.js'), workerArgs)

    log.info('created balances worker, pid:', this.worker.pid)

    this.worker.on('message', (message: WorkerMessage) => {
      log.debug(`balances controller message: ${JSON.stringify(message)}`)

      if (message.type === 'ready') {
        log.info(`balances worker ready, pid: ${this.worker.pid}`)

        this.heartbeat = setInterval(() => this.sendHeartbeat(), 1000 * 20)

        this.emit('ready')
      }

      if (message.type === 'chainBalances') {
        const { address, balances } = (message as ChainBalanceMessage)
        this.emit('chainBalances', address, balances)
      }

      if (message.type === 'tokenBalances') {
        const { address, balances, source } = (message as TokenBalanceMessage)
        this.emit('tokenBalances', address, balances, source)
      }
    })
  
    this.worker.on('exit', code => {
      const exitCode = code || this.worker.signalCode
      log.warn(`balances worker exited with code ${exitCode}, pid: ${this.worker.pid}`)
      this.close()
    })
  
    this.worker.on('disconnect', () => {
      log.warn(`balances worker disconnected`)
      this.close()
    })

    this.worker.on('error', err => {
      log.warn(`balances worker sent error, pid: ${this.worker.pid}`, err)
      this.close()
    })
  }

  close () {
    if (this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = undefined
    }

    this.worker.removeAllListeners()
  
    const exitCode = this.worker.exitCode
    const killed = this.worker.killed || this.worker.kill('SIGTERM')

    log.info(`worker controller closed, exitCode: ${exitCode}, killed by controller: ${killed}`)

    this.emit('close')
    this.removeAllListeners()
  }

  isRunning () {
    return !!this.heartbeat
  }

  updateChainBalances (address: Address, chains: number[]) {
    this.sendCommandToWorker('updateChainBalance', [address, chains])
  }

  updateKnownTokenBalances (address: Address, tokens: Token[]) {
    this.sendCommandToWorker('fetchTokenBalances', [address, tokens])
  }

  scanForTokenBalances (address: Address, tokens: Token[], chains: number[]) {
    this.sendCommandToWorker('tokenBalanceScan', [address, tokens, chains])
  }

  // sending messages
  private sendCommandToWorker (command: string, args: any[] = []) {
    log.debug(`sending command ${command} to worker`)

    try {
      if (!this.worker.connected || !this.worker.channel) {
        log.error(`attempted to send command "${command}" to worker but worker cannot be reached!`)
        return
      }

      this.worker.send({ command, args })
    } catch (e) {
      log.error(`unknown error sending command "${command}" to worker`, e)
    }
  }

  private sendHeartbeat () {
    this.sendCommandToWorker('heartbeat')
  }
}
