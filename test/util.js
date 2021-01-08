/* globals expect */

const EventEmitter = require('events')
const store = require('../main/store')

class Observer extends EventEmitter {
  constructor (root, keys) {
    super()

    // Setup observer for root
    store.observer(_ => {
      const value = store(root)
      this.emit('root', value)
    })

    // Setup observers for each key
    keys.forEach((key) => {
      store.observer(_ => {
        const value = store(`${root}.${key}`)
        this.emit(key, value)
      })
    })
  }
}

class Counter {
  constructor (max, done) {
    this.count = 0
    this.max = max
    this.done = done
  }

  expect (value) {
    this.count++
    setTimeout(() => {
      if (this.count === this.max) this.done()
    }, 1)
    return expect(value)
  }
}

module.exports = { Counter, Observer }
