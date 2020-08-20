/**
 * @jest-environment node
 */

// Node
const fs = require('fs')
const path = require('path')

// NPM
const { remove } = require('fs-extra')
const axios = require('axios')

// Frame
const parity = require('../../main/clients/Parity')
const store = require('../../main/store')

// Local
const { Counter, Observer } = require('../util')

// Global setup
const observer = new Observer('main.clients.parity', ['state', 'installed', 'latest', 'version'])
const parityDir = path.resolve('./test/.userData/parity')

// Helper functions
const clean = () => {
  // Reset work dir
  remove(parityDir)
  // Reset client
  store.resetClient('parity')
}
const makeRPCCall = async () => {
  const message = { jsonrpc: '2.0', id: 1, method: 'net_listening', params: [] }
  const res = await axios.post('http://127.0.0.1:8545', message)
  return res.data.result
}

describe('Parity', () => {
  // Setup test suite
  jest.setTimeout(30000)
  beforeAll(clean)
  afterAll(clean)

  test('Client should not be installed', (done) => {
    setTimeout(() => {
      // 1) Check for that client directory doesn't exist
      expect(fs.existsSync(parityDir)).toEqual(false)
      // 2) Check that state reflects that client is not installed
      const { latest, installed, state } = store('main.clients.parity')
      expect(latest).toBe(false)
      expect(installed).toBe(false)
      expect(state).toBe('off')
      done()
    }, 100)
  })

  test('Install client', (done) => {
    const counter = new Counter(5, done)

    // 1) On installing
    observer.once('state', (state) => {
      // Assert state change
      counter.expect(state).toBe('installing')

      // 2) On install done -> assert state change
      observer.once('installed', (installed) => counter.expect(installed).toBe(true))
      observer.once('latest', (latest) => counter.expect(latest).toBe(true))
      observer.once('version', (version) => counter.expect(typeof version).toBe('string'))
      observer.once('state', (state) => counter.expect(state).toBe('off'))
    })
    // Run install process
    parity.install()
  })

  test('Uninstall client', (done) => {
    const counter = new Counter(5, done)

    // Setup observers
    observer.once('installed', (installed) => counter.expect(installed).toBe(false))
    observer.once('latest', (latest) => counter.expect(latest).toBe(false))
    observer.once('version', (version) => counter.expect(version).toBe(null))
    observer.once('state', (state) => {
      counter.expect(state).toBe('off')
      counter.expect(fs.existsSync(parityDir)).toEqual(false)
    })

    // Run uninstall process
    parity.uninstall()
  })

  test('Start and automatically install client', (done) => {
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'installing'
    observer.once('state', (state) => {
      counter.expect(state).toBe('installing')

      // 2) Expect state to change to 'off'
      observer.once('state', async (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect state to change to 'ready' or 'syncing'
        observer.once('state', async (state) => {
          counter.expect(['syncing', 'ready'].includes(state)).toBe(true)

          // 4) Expect client to respond to JSON RPC call
          const isListening = await makeRPCCall()
          counter.expect(isListening).toBe(true)
        })
      })
    })
    // Start client
    parity.start()
  })

  test('Stop client', (done) => {
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'terminating'
    observer.once('state', (state) => {
      counter.expect(state).toBe('terminating')

      // 2) Expect state to chagne to 'off'
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(parity.process).toBe(null)

        // 4) Expect JSON RPC call to fail
        counter.expect(makeRPCCall()).rejects.toThrow()
      })
    })
    // Stop client
    parity.stop()
  })

  test('Start client again', (done) => {
    const counter = new Counter(3, done)

    // 1) Expect state to change to 'starting'
    observer.once('state', async (state) => {
      counter.expect(state).toBe('starting')

      // 2) Expect state to change to 'ready' or 'syncing'
      observer.once('state', async (state) => {
        counter.expect(['syncing', 'ready'].includes(state)).toBe(true)

        // 3) Expect client to respond to JSON RPC call
        const isListening = await makeRPCCall()
        counter.expect(isListening).toBe(true)
      })
    })

    // Start client
    setTimeout(() => {
      parity.start()
    }, 1000)
  })

  test('Stop client again', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'terminating'
    observer.once('state', (state) => {
      counter.expect(state).toBe('terminating')

      // 2) Expect state to chagne to 'off'
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(parity.process).toBe(null)

        // 4) Expect JSON RPC call to fail
        counter.expect(makeRPCCall()).rejects.toThrow()
      })
    })
    // Stop client
    parity.stop()
  })
})
