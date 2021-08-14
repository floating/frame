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
    setInterval(() => this.writeUpdates(), 30 * 1000)
  }

  writeUpdates () {
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
    path = `main.__.${migrations.latest}.${path}`
    super.set(path, value)
  }
}

module.exports = new PersistStore()
