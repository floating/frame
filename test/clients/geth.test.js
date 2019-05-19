const geth = require('../../main/services/geth')
const store = require('../../main/store')
const path = require('path')
const fs = require('fs')
const { emptyDir } = require('fs-extra')
const assert = require('assert')
const EventEmitter = require('events')

const userData = path.resolve('./test/.userData')

// TODO: Move to util directory (and talk to Jordan about this setup)
class Observer extends EventEmitter {
  constructor(root, keys) {
    super()

    // Setup root observer
    this.root = new EventEmitter()
    store.observer(_ => {
      const value = store(root)
      this.emit('change', value)
    })

    // Setup key observers
    keys.forEach((key) => {
      this[key] = new EventEmitter()
      store.observer(_ => {
        const value = store(`${root}.${key}`)
        this[key].emit('change', value)
      })
    })
  }
}


class Counter {
  constructor(number, done) {
    this.count = 0
    this.number = number
    this.done = done
  }

  expect (value) {
    this.count++
    setTimeout(() => {
      if (this.count === this.number) {
        this.done()
      }
    }, 1)
    return expect(value)
  }

}

const observer = new Observer('main.clients.geth', ['state', 'installed', 'latest', 'version'])
const clean = async () => await emptyDir(userData)

describe('Installing and uninstalling geth', () => { 

  // BEFORE: Make sure test user data directory is empty
  beforeAll(clean)
  afterAll(clean)

  test('Install geth', function(done) {
    const counter = new Counter(4, done)
    // ASSERT: User data directory is empty
    const files = fs.readdirSync(userData)
    counter.expect(files.length).toEqual(0)

    // ASSERT: Store reflects uninstalled client
    const { latest, installed, state } = store('main.clients.geth')
    counter.expect(latest).toBe(false)
    counter.expect(installed).toBe(false)
    counter.expect(state).toBe('off')
  })

  test('Client should install', function (done) {
    // Setup test
    const counter = new Counter(5, done)
    jest.setTimeout(30000)
               
    // On installing -> assert state change
    observer.state.once('change', (value) => {
      counter.expect(value).toBe('installing')
       // On install done -> assert state change
      observer.installed.once('change', (value) => counter.expect(value).toBe(true))
      observer.latest.once('change', (value) => counter.expect(value).toBe(true))
      observer.version.once('change', (value) => counter.expect(typeof(value)).toBe('string'))
      observer.state.once('change', (value) => counter.expect(value).toBe('off'))
    })

    // observer.state.on('change', console.log)
    // Run install process
    geth.install()
  })

  test('Client should uninstall', function (done) {
    const counter = new Counter(4, done)
    
    observer.once('change', (data) => {
      // ASSERT: Store reflects uninstalled client
      counter.expect(data.installed).toBe(false)
      counter.expect(data.latest).toBe(false)
      counter.expect(data.state).toBe('off')
      // ASSERT: User data directory is empty
      const files = fs.readdirSync(userData)
      counter.expect(files.length).toBe(0)
    })
    // Run uninstall process
    geth.uninstall()
  })
})