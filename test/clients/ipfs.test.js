/**
 * @jest-environment node
 */

// Node
const fs = require('fs')
const path = require('path')

// NPM
const { emptyDir } = require('fs-extra')
const axios = require('axios')

// Frame
const ipfs = require('../../main/services/ipfs')
const store = require('../../main/store')

// Local
const { Counter, Observer } = require('../util')

// Helper functions
const clean = () => emptyDir(userData)
const getVersion = async () => {
  const res = await axios.get('http://127.0.01:5001/api/v0/version')
  return res.data.Version
}

// Global setup
const observer = new Observer('main.clients.ipfs', ['state', 'installed', 'latest', 'version'])
const userData = path.resolve('./test/.userData')

describe('IPFS client', () => {
  // Setup test suite
  jest.setTimeout(30000)
  beforeAll(clean)
  afterAll(clean)

  test('Client should not be installed', () => {
    // 1) Check for that client directory doesn't exist
    const ipfsDir = path.resolve(userData, 'ipfs')
    expect(fs.existsSync(ipfsDir)).toEqual(false)
    // 2) Check that state reflects that client is not installed
    const { latest, installed, state } = store('main.clients.ipfs')
    expect(latest).toBe(false)
    expect(installed).toBe(false)
    expect(state).toBe(null)
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
      counter.expect(state).toBe(null)
      const files = fs.readdirSync(userData)
      counter.expect(files.length).toBe(0)
    })

    // Run uninstall process
    ipfs.uninstall()
  })

  test('Start and automatically install client', (done) => {
    // SETUP: Expect 3 assertions
    const counter = new Counter(4, done)

    // 1) Expect state to change to 'installing'
    observer.once('state', (state) => {
      counter.expect(state).toBe('installing')

      // 2) Expect state to change to 'off'
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect state to change to 'ready'
        observer.once('state', async (state) => {
          counter.expect(state).toBe('ready')

          // 4) Expect client to return version and version to match
          const version = await getVersion()
          counter.expect(version).toBe(store('main.clients.ipfs.version'))
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
      observer.once('state', (state) => {
        counter.expect(state).toBe('off')

        // 3) Expect process to have terminated
        counter.expect(ipfs.process).toBe(null)

        // 4) Expect API call to fail
        counter.expect(getVersion()).rejects.toThrow()
      })
    })
    // Stop client
    ipfs.stop()
  })
})
