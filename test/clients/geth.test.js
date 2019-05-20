/**
 * @jest-environment node
 */

const geth = require('../../main/services/geth')
const store = require('../../main/store')
const path = require('path')
const fs = require('fs')
const { emptyDir } = require('fs-extra')
const assert = require('assert')
const EventEmitter = require('events')
const axios = require('axios')

const userData = path.resolve('./test/.userData')

// TODO: Move to util directory (and talk to Jordan about this setup)
class Observer extends EventEmitter {
  constructor(root, keys) {
    super()

    store.observer(_ => {
      const value = store(root)
      this.emit('root', value)
    })

    // Setup key observers
    keys.forEach((key) => {
      store.observer(_ => {
        const value = store(`${root}.${key}`)
        this.emit(key, value)
      })
    })
  }
}

// TODO: Move to util directory (and talk to Jordan about this setup)
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
const makeRPCCall = async () => {
  const message = { jsonrpc: '2.0', id: 1, method: 'net_listening', params: [] }
  const res = await axios.post('http://127.0.0.1:8545', message)
  return res.data.result
}

describe('Geth', () => {
  // Setup test suite
  jest.setTimeout(30000)
  beforeAll(clean)
  afterAll(clean)

  test('Client directory should not exist', () => {
    const gethDir = path.resolve(userData, 'geth')
    expect(fs.existsSync(gethDir)).toEqual(false)
  })

  test('Application state should reflect client not being installed', () => {
    const { latest, installed, state } = store('main.clients.geth')
    expect(latest).toBe(false)
    expect(installed).toBe(false)
    expect(state).toBe(null)
  })

  test('On install -> client should install', (done) => {
    // SETUP: Expect 5 assertions
    const counter = new Counter(5, done)

    // 1) On installing
    observer.once('state', (state) => {
      // Assert state change
      counter.expect(state).toBe('installing')

      // 2) On install done -> assert state change
      observer.once('installed', (installed) => counter.expect(installed).toBe(true))
      observer.once('latest', (latest) => counter.expect(latest).toBe(true))
      observer.once('version', (version) => counter.expect(typeof(version)).toBe('string'))
      observer.once('state', (state) => counter.expect(state).toBe('off'))
    })
    // Run install process
    geth.install()
  })

  test('On uninstall -> client should uninstall', (done) => {
    // SETUP: Expect 5 assertions
    const counter = new Counter(5, done)
    
    // Setup observers
    observer.once('installed', (installed) => counter.expect(installed).toBe(false))
    observer.once('latest', (latest) => counter.expect(latest).toBe(false))
    observer.once('version', (version) => counter.expect(version).toBe(null))
    observer.once('state', (state) => {
      counter.expect(state).toBe(null)
      const files = fs.readdirSync(userData)
      counter.expect(files.length).toBe(0)
    })
    
    // Run uninstall process
    geth.uninstall()
  })

  test.only('On start -> client should install and run', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(3, done)
    
    // 1) Expect state to change to 'installing'
    observer.once('state', (state) => {
      counter.expect(state).toBe('installing')
      
      // 2) Expect state to change to 'off'
      observer.once('state', async (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect client to respond to JSON RPC call
        setTimeout(async () => {
          const isListening = await makeRPCCall()
          counter.expect(isListening).toBe(true)  
        }, 1000);
        
      })
    })
    // Start client
    geth.start()
  })

  test.only('On stop -> client should stop', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(4, done)
    
    // 1) Expect state to change to 'terminating'
    observer.once('state', (state) => {
      counter.expect(state).toBe('terminating')

      // 2) Expect state to chagne to 'off'
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(geth.process).toBe(null)
        
        // 4) Expect JSON RPC call to fail
        counter.expect(makeRPCCall()).rejects.toThrow()
        
      })
    })
    // Stop client
    geth.stop()
  })

})