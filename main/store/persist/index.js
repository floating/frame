const path = require('path')
const electron = require('electron')
const Conf = require('conf')

const migrations = require('../migrations')

class PersistStore extends Conf {
  constructor (options) {
    options = { configName: 'config', ...options }
    let defaultCwd = __dirname
    if (electron && electron.app) defaultCwd = electron.app.getPath('userData')
    if (options.cwd) {
      options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd)
    } else {
      options.cwd = defaultCwd
    }
    electron.app.on('quit', () => this.writeUpdates())
    super(options)
    setInterval(() => this.writeUpdates(), 5 * 1000)
  }

  addCrashReportFields () {
    const fields = ['networks', 'networksMeta', 'balances', 'tokens', 'accounts']

    fields.forEach(field => {
      const fieldStateData = (this.store.main.__['18']?.main || {})[field]

      if (fieldStateData) {
        electron.crashReporter.addExtraParameter(field, JSON.stringify(fieldStateData))
      }
    })
  }

  writeUpdates () {
    if (this.blockUpdates) return

    if (electron && electron.crashReporter) {
      this.addCrashReportFields()
    }

    const updates = { ...this.updates }
    this.updates = null
    if (Object.keys(updates || {}).length > 0) super.set(updates)
  }

  queue (path, value) {
    path = `main.__.${migrations.latest}.${path}`
    this.updates = this.updates || {}
    delete this.updates[path] // maintain entry order
    this.updates[path] = JSON.parse(JSON.stringify(value))
  }

  set (path, value) {
    if (this.blockUpdates) return
    path = `main.__.${migrations.latest}.${path}`
    super.set(path, value)
  }

  clear () {
    this.blockUpdates = true
    super.clear()
  }
}

module.exports = new PersistStore()
