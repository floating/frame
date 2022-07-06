<<<<<<< HEAD
import { ChildProcess, fork } from 'child_process'
=======
import { ChildProcess, fork } from "child_process"
>>>>>>> finish worker abstractions
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
<<<<<<< HEAD
  args?: string[]
  env?: Record<string, string>
=======
  args: string[]
>>>>>>> finish worker abstractions
  timeout?: number
}

export default class WorkerProcess extends EventEmitter {
  private readonly abortController
  private readonly worker: ChildProcess
<<<<<<< HEAD
  private readonly name: string
=======
>>>>>>> finish worker abstractions

  constructor (opts: WorkerOptions) {
    super()

<<<<<<< HEAD
    this.name = opts.name
    this.abortController = new AbortController()
    const { signal } = this.abortController

    log.verbose('creating worker with path:', opts.modulePath + ' ' + (opts.args || []).join(' '))

    this.worker = fork(
      opts.modulePath,
      opts.args,
      {
        signal,
        env: opts.env
      }
    )

    log.info(`created ${this.name} worker, pid: ${this.worker.pid}`)

    if (opts.timeout) {
      setTimeout(() => {
        log.warn(`worker process ${this.name} timed out`)
=======
    this.abortController = new AbortController()
    const { signal } = this.abortController

    this.worker = fork(opts.modulePath, opts.args, { signal })

    log.info(`created ${opts.name} worker, pid: ${this.worker.pid}`)

    if (opts.timeout) {
      setTimeout(() => {
        log.warn(`worker process ${opts.name} timed out`)
>>>>>>> finish worker abstractions
        this.abortController.abort()
      }, opts.timeout)
    }

    this.worker.on('message', (message: WorkerProcessMessage) => this.emit(message.event, message.payload))

    this.worker.once('error', err => {
<<<<<<< HEAD
      log.warn(`worker process ${this.name} raised error: ${err}`)
=======
      log.warn(`worker process ${opts.name} raised error: ${err}`)
>>>>>>> finish worker abstractions
      this.kill()
    })

    this.worker.once('exit', code => {
<<<<<<< HEAD
      log.verbose(`worker process ${this.name} exited with code: ${code}`)
=======
      log.verbose(`worker process ${opts.name} exited with code: ${code}`)
>>>>>>> finish worker abstractions
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
