export interface Request {
  execute: () => Promise<any>,
  type: string
}

const noRequest = {
  type: 'emptyQueue',
  execute: () => Promise.resolve()
}

export class RequestQueue {
  private running = false;
  private requestQueue: Array<Request> = []
  private requestPoller = setTimeout(() => {})

  add (request: Request) {
    console.log('ADDING REQUEST', request.type)
    this.requestQueue.push(request)
  }

  pollRequest () {
    console.log('QUEUE DEPTH', this.requestQueue.length)
    // each request must return a resolved promise
    const request = (this.requestQueue.length === 0) 
      ? noRequest
      : this.requestQueue.splice(0, 1)[0]

    request.execute().then(() => {
      if (this.running) {
        this.requestPoller = setTimeout(this.pollRequest.bind(this), 200)
      }
    })
  }

  start () {
    this.running = true
    this.pollRequest()
  }
  
  stop () {
    this.running = false
    clearTimeout(this.requestPoller)
  }

  close () {
    this.stop()
    this.requestQueue = []
  }

  peekBack () {
    return this.requestQueue[this.requestQueue.length - 1]
  }
}