const EventEmitter = require('events')
const fs = require('fs')
const https = require('https')
const path = require('path')
const { app } = require('electron')
const semver = require('semver')
const { execFile } = require('child_process')
const tar = require('tar')
// const unzip = require('extract-zip')
const latest = require('../latest.json')
const store = require('../../store')
const { mkdirP, rmRF } = require('./util')

const userData = app ? app.getPath('userData') : './test/clients/userData'

class Service extends EventEmitter {
  constructor (name, options = { log: false }) {
    super()

    // Set instance variables
    this.name = name
    this.workdir = path.resolve(userData, name) // path.resolve(name)
    this.versionFile = path.resolve(this.workdir, '.version')
    this.latest = latest[this.name]
    this.release = this.latest.platform[process.platform][process.arch]
    this.bin = path.resolve(this.workdir, this.release.bin)
    this.process = null

    // Update store
    this._updateStore()

    // Log (if log flag set)
    if (options.log) {
      this.on('stdout', console.log)
      this.on('stderr', console.error)
      this.on('error', console.error)
    }
  }

  get version () { return fs.existsSync(this.versionFile) ? fs.readFileSync(this.versionFile, 'utf8') : null }
  get isInstalled () { return fs.existsSync(this.versionFile) }
  get isLatest () { return semver.satisfies(this.latest.version, this.version) }

  install () {
    // Set state to 'installing'
    store.setClientState(this.name, 'installing')

    // Get release metadata by device platform and architecture
    if (!this.release) throw Error('Could not find release matching platform and architecture')
    const fileName = path.resolve(this.workdir, this.release.location.split('/').pop())

    // If working directory doesn't exist -> create it
    mkdirP(this.workdir)

    // Get archive from release store
    https.get(this.release.location, (res) => {
      // Stream response into file
      let stream = fs.createWriteStream(fileName)
      let file = res.pipe(stream)

      // On download complete ->
      file.on('finish', async () => {
        // Extract archive
        await this._extract(fileName)

        // Delete archive
        fs.unlinkSync(fileName)

        // Update version file
        fs.writeFileSync(this.versionFile, this.latest.version)

        // Update store
        store.setClientState(this.name, 'off')
        this._updateStore()
      })
    })
  }

  uninstall () {
    // Remove client dir and files wihtin
    rmRF(this.workdir)
    // Update store
    this._updateStore()
  }

  _stop () {
    // Make sure client is running
    if (!this.process) return

    // On close -> set state to 'off'
    this.once('close', (code) => store.setClientState(this.name, 'off'))

    // Send 'SIGTERM' to client process
    this.process.kill()

    // Set state to 'terminating'
    store.setClientState(this.name, 'terminating')
  }

  _start () {
    // If client isn't installed or version out of date -> update
    if (!this.isInstalled || !this.isLatest) {
      this.on('installed', () => this.emit('ready'))
      this.install()
    } else {
      this.emit('ready')
    }
  }

  async _extract (fileName, typ) {
    // Handle tar
    if (fileName.includes('.tar')) {
      return tar.x({
        file: fileName,
        cwd: this.workdir,
        strip: 1
      })
    }

    // Handle zip
    if (fileName.includes('.zip')) {
      // TODO: Implement unzip
    }
  }

  _run (args) {
    this.process = execFile(this.bin, args, (err, stdout, stderr) => {
      if (err) this.emit('error', err)
      if (stdout) this.emit('stdout', stdout)
      if (stderr) this.emit('stderr', stderr)
    })
    this.process.stdout.on('data', (data) => this.emit('stdout', data))
    this.process.stderr.on('data', (data) => this.emit('stderr', data))
    this.process.on('close', (code) => {
      this.emit('close', code)
      this.process = null
    })
  }

  _updateStore () {
    store.updateClient(this.name, 'installed', this.isInstalled)
    store.updateClient(this.name, 'latest', this.isLatest)
    store.updateClient(this.name, 'version', this.version)
  }
}
module.exports = Service

// DEBUG
// const s = new Service('ipfs')
// s.on('status', console.log)
// s.init().then(console.log)
