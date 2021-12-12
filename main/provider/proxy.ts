import EventEmitter from 'events'
class Proxy extends EventEmitter {
  ready = false
}

export default new Proxy()
