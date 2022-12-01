import log from 'electron-log'

export interface Request {
  execute: () => Promise<any>
  type: string
}

const noRequest = {
  type: 'emptyQueue',
  execute: () => Promise.resolve(),
}

export class RequestQueue {
  private running = false
  private requestQueue: Array<Request> = []
  private requestPoller = setTimeout(() => {})

  add(request: Request) {
    this.requestQueue.push(request)
  }

  pollRequest() {
    // each request must return a promise
    const request = this.requestQueue.length === 0 ? noRequest : this.requestQueue.splice(0, 1)[0]

    request
      .execute()
      .catch((err) => log.warn('Ledger request queue caught unexpected error', err))
      .finally(() => {
        if (this.running) {
          this.requestPoller = setTimeout(this.pollRequest.bind(this), 200)
        }
      })
  }

  start() {
    this.running = true
    this.pollRequest()
  }

  stop() {
    this.running = false
    clearTimeout(this.requestPoller)
  }

  close() {
    this.stop()
    this.clear()
  }

  clear() {
    this.requestQueue = []
  }

  peekBack() {
    return this.requestQueue[this.requestQueue.length - 1]
  }
}
