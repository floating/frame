const geth = require('../../main/services/geth')
const store = require('../../main/store')
const path = require('path')
const fs = require('fs')
const { emptyDir } = require('fs-extra')
const assert = require('assert')
const EventEmitter = require('events')

const userData = path.resolve('./test/clients/userData')

const clean = async () => await emptyDir(userData)

class Observer extends EventEmitter {
  constructor(key) {
    super()
    store.observer(_ => {
      const value = store(key)
      this.emit('change', value)
    })
  }
}

describe('Install and uninstall client', function (done) {

  const observer = new Observer('main.clients.geth')

  // BEFORE: Make sure test user data directory is empty
  before(clean)

  it('Client should not be installed', function() {
    // ASSERT: User data directory is empty
    const files = fs.readdirSync(userData)
    assert.equal(files.length, 0)

    // ASSERT: Store reflects uninstalled client
    const { latest, installed, state } = store('main.clients.geth')
    assert.equal(latest, false)
    assert.equal(installed, false)
    assert.equal(state, 'off')
  })

  it('Client should install', function (done) {

    this.timeout(30000)

    // Begin installation
    observer.once('change', (data) => {
      assert.equal(data.state, 'installing')

      // Installation done
      observer.once('change', (data) => {
        assert.equal(data.installed, true)
        assert.equal(data.latest, true)
        assert.notEqual(data.version, null)
        done()
      })
    })

    // Run install process
    geth.install()
  })

  it('Client should uninstall', function (done) {
    observer.once('change', (data) => {
      // ASSERT: Store reflects uninstalled client
      assert.equal(data.installed, false)
      assert.equal(data.latest, false)
      assert.equal(data.state, 'off')
      // ASSERT: User data directory is empty
      const files = fs.readdirSync(userData)
      assert.equal(files.length, 0)
      done()
    })
    // Run uninstall process
    geth.uninstall()
  })

  // AFTER: Clean up test user data directory
  after(clean)

})