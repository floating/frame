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
const ipfs = require('../../main/clients/Ipfs')
const store = require('../../main/store')

// Local
const { Counter, Observer } = require('../util')

// Global setup
const observer = new Observer('main.clients.ipfs', ['state', 'installed', 'latest', 'version'])
const ipfsDir = path.resolve('./test/.userData/ipfs')

// Helper functions
const clean = () => {
  // Reset work dir
  remove(ipfsDir)
  // Reset client
  store.resetClient('ipfs')
}

describe('IPFS client', () => {
  // Setup test suite
  jest.setTimeout(30000)
  beforeAll(clean)
  afterAll(clean)

  test('Client should not be installed', (done) => {
    setTimeout(() => {
      // 1) Check for that client directory doesn't exist
      expect(fs.existsSync(ipfsDir)).toEqual(false)
      // 2) Check that state reflects that client is not installed
      const { latest, installed, state } = store('main.clients.ipfs')
      expect(latest).toBe(false)
      expect(installed).toBe(false)
      expect(state).toBe('off')
      done()
    }, 100)
  })

  test('Install client', (done) => {
    // SETUP: Expect 5 assertions
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
    ipfs.install()
  })

  test('Uninstall client', (done) => {
    // SETUP: Expect 5 assertions
    const counter = new Counter(5, done)

    // Setup observers
    observer.once('installed', (installed) => counter.expect(installed).toBe(false))
    observer.once('latest', (latest) => counter.expect(latest).toBe(false))
    observer.once('version', (version) => counter.expect(version).toBe(null))
    observer.once('state', (state) => {
      counter.expect(state).toBe('off')
      counter.expect(fs.existsSync(ipfsDir)).toEqual(false)
    })

    // Run uninstall process
    ipfs.uninstall()
  })

  test('Start and automatically install client', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(3, done)

    // 1) Expect state to change to 'installing'
    observer.once('state', (state) => {
      counter.expect(state).toBe('installing')

      // 2) Expect state to change to 'off'
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect state to change to 'ready'
        observer.once('state', async (state) => {
          counter.expect(state).toBe('ready')
        })
      })
    })
    // Start client
    ipfs.start()
  })

  test('Stop client', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'terminating'
    observer.once('state', (state) => {
      counter.expect(state).toBe('terminating')

      // 2) Expect state to chagne to 'off'
      observer.once('state', async (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(ipfs.process).toBe(null)

        // 4) Expect client not to be running
        counter.expect(await ipfs.isRunning()).toBe(false)
      })
    })
    // Stop client
    ipfs.stop()
  })

  test('Start client again', (done) => {
    const counter = new Counter(3, done)

    // 1) Expect state to change to 'starting'
    observer.once('state', async (state) => {
      counter.expect(state).toBe('starting')

      // 2) Expect state to change to 'ready'
      observer.once('state', async (state) => {
        counter.expect(state).toBe('ready')

        // 3) Expect isRunning to be true
        counter.expect(await ipfs.isRunning()).toBe(true)
      })
    })

    // Start client
    setTimeout(() => {
      ipfs.start()
    }, 1000)
  })

  test('Stop client again', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'terminating'
    observer.once('state', (state) => {
      counter.expect(state).toBe('terminating')

      // 2) Expect state to chagne to 'off'
      observer.once('state', async (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(ipfs.process).toBe(null)

        // 4) Expect isRunning to return false
        counter.expect(await ipfs.isRunning()).toBe(false)
      })
    })
    // Stop client
    ipfs.stop()
  })
})
