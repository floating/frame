const path = require('path')
const electron = require('electron')
const Conf = require('conf')

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
    super(options)
  }
}

module.exports = new PersistStore()
