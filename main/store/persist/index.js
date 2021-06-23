const path = require('path')
const electron = require('electron')
const Conf = require('conf')
const log = require('electron-log')

const migrations = require('../migrations')

class PersistStore extends Conf {
  constructor (options) {
    options = { configName: 'config', ...options }
    let defaultCwd = __dirname
    // for dev if (electron && electron.app) defaultCwd = electron.app.getPath('userData')
    if (options.cwd) {
      options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd)
    } else {
      options.cwd = defaultCwd
    }
    super(options)
  }

  set (path, value) {
    log.info('Setting state version', migrations.latest)
    path = `main.__.${migrations.latest}.${path}`
    super.set(path, value)
  }
}

module.exports = new PersistStore()
