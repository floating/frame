const path = require('path')
const electron = require('electron')
const Conf = require('conf')
const log = require('electron-log')

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
  }

  writeUpdates () {
    const updates = { ...this.updates }
    this.updates = null
    if (Object.keys(updates || {}).length > 0) super.set(updates)
  }

  set (path, value) {
    path = `main.__.${migrations.latest}.${path}`
    this.updates = this.updates || {}
    this.updates[path] = JSON.parse(JSON.stringify(value))
    if (Object.keys(this.updates).length < 75) clearTimeout(this.updateTimer)
    this.updateTimer = setTimeout(() => this.writeUpdates(), 4000)
  }
}

module.exports = new PersistStore()
