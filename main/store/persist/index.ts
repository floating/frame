import path from 'path'
import fs from 'fs'
import electron from 'electron'
import log from 'electron-log'
import Conf, { Options } from 'conf'

import migrations from '../migrate'

function backupConfig(path: string, data: any) {
  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      log.error(`Failed to backup config file: ${err.message}`)
    } else {
      log.verbose(`Backed up config file to ${path}`)
    }
  })
}

class PersistStore extends Conf {
  private blockUpdates = false
  private updates: Record<string, any> | null = {}

  constructor(options?: Options<any>) {
    options = { configFileMode: 0o600, configName: 'config', ...options }
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

  writeUpdates() {
    if (this.blockUpdates) return

    const updates = { ...this.updates }
    this.updates = null
    if (Object.keys(updates || {}).length > 0) super.set(updates)
  }

  queue(path: string, value: any) {
    path = `main.__.${migrations.latest}.${path}`
    this.updates = this.updates || {}
    delete this.updates[path] // maintain entry order
    this.updates[path] = JSON.parse(JSON.stringify(value))
  }

  set(path: any, value?: unknown) {
    if (this.blockUpdates) return
    path = `main.__.${migrations.latest}.${path}`
    super.set(path, value)
  }

  clear() {
    this.blockUpdates = true
    super.clear()
  }
}

const persist = new PersistStore()

backupConfig(persist.path + '.backup', persist.store)

export default new PersistStore()
