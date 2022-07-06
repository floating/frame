import { EventEmitter } from 'events'
import log from 'electron-log'

// message from a worker process to the parent
export interface WorkerProcessMessage {
  event: string,
  payload: any
}

// message from a parent process to a worker
export interface WorkerProcessCommand {
  command: string
  args: any[]
}

export interface WorkerOptions {
  modulePath: string
  name: string
  args: string[]
  timeout?: number
}

export default class WorkerProcess extends EventEmitter {
  private readonly abortController
  private readonly worker: ChildProcess

  constructor (opts: WorkerOptions) {
    super()

    this.abortController = new AbortController()
    const { signal } = this.abortController

    // use spawn instead of fork since Electron hardcodes ELECTRON_RUN_AS_NODE=true
    // when using fork
    this.worker = spawn(
      process.execPath,
      [opts.modulePath, ...opts.args],
      {
        signal,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      }
    )

    log.info(`created ${opts.name} worker, pid: ${this.worker.pid}`)

    if (opts.timeout) {
      setTimeout(() => {
        log.warn(`worker process ${opts.name} timed out`)
        this.abortController.abort()
      }, opts.timeout)
    }

    this.worker.on('message', (message: WorkerProcessMessage) => this.emit(message.event, message.payload))

    this.worker.once('error', err => {
      log.warn(`worker process ${opts.name} raised error: ${err}`)
      this.kill()
    })

    this.worker.once('exit', code => {
      log.verbose(`worker process ${opts.name} exited with code: ${code}`)
      this.kill()
    })
  }

  send (command: string, ...args: any[]) {
    this.worker.send({ command, args })
  }

  kill (signal?: NodeJS.Signals) {
    this.emit('exit')

    this.removeAllListeners()
    this.worker.kill(signal)
  }
}
