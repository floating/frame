const EventEmitter = require('events')
const fs = require('fs')
const https = require('https')
const path = require('path')
const { app } = require('electron')
const log = require('electron-log')
const semver = require('semver')
const { execFile } = require('child_process')
const tar = require('tar')
const extractZip = require('extract-zip')
const latest = require('../latest.json')
const store = require('../../store')
const { mkdirp, remove } = require('fs-extra')

const userData = app ? app.getPath('userData') : './test/.userData'

const SIGTERM_TIMEOUT = 3000

class Client extends EventEmitter {
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

    // On new state -> update store
    this.on('state', state => store.setClientState(this.name, state))

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

  async install () {
    // Log and emit state
    log.info(`${this.name}: installing`)
    this.emit('state', 'installing')

    // Get release metadata by device platform and architecture
    if (!this.release) throw Error('Could not find release matching platform and architecture')
    const fileName = path.resolve(this.workdir, this.release.location.split('/').pop())

    // If working directory doesn't exist -> create it
    await mkdirp(this.workdir)

    // Get archive from release store
    https.get(this.release.location, (res) => {
      // Stream response into file
      let stream = fs.createWriteStream(fileName)
      let file = res.pipe(stream)

      // On download complete ->
      file.on('finish', async () => {
        // Extract (and delete) archive
        await this._extract(fileName)

        // Update version file
        fs.writeFileSync(this.versionFile, this.latest.version)

        // Log and emit state
        log.info(`${this.name}: installed`)
        this.emit('state', 'off')
        this.emit('installed')

        // Update store
        this._updateStore()
      })
    })
  }

  async uninstall () {
    // Remove client dir and files wihtin
    await remove(this.workdir)

    // Update store
    this._updateStore()

    // Log and emit state
    log.info(`${this.name}: uninstalled`)
    this.emit('state', 'off')
  }

  _start () {
    // Log and emit state
    log.info(`${this.name}: starting`)
    this.emit('state', 'starting')

    // If client isn't installed or version out of date -> update
    if (!this.isInstalled || !this.isLatest) {
      this.on('installed', () => this.emit('ready'))
      this.install()
    } else {
      this.emit('ready')
    }
  }

  _stop () {
    return new Promise((resolve, reject) => {
      // Make sure client is running
      if (!this.process) resolve()

      // If still alive after <INTERVAL> ms, send 'SIGKILL'
      const timeout = setTimeout(() => {
        if (this.process) this.process.kill('SIGKILL')
      }, SIGTERM_TIMEOUT)

      // On exit -> set state to 'off'
      this.once('exit', (code) => {
        log.info(`${this.name}: off`)
        log.info(`${this.name}: exit code ${code}`)
        this.emit('state', 'off')
        resolve()
        clearTimeout(timeout)
      })

      // Send 'SIGTERM' to client process
      this.process.kill('SIGTERM')

      // Log and emit state
      this.emit('state', 'terminating')
      log.info(`${this.name}: terminating`)
    })
  }

  async _extract (fileName) {
    // Handle tar
    if (fileName.includes('.tar')) {
      // Extract archive
      await tar.x({
        file: fileName,
        cwd: this.workdir,
        strip: 1
      })
      // Delete archive
      return remove(fileName)
    }

    // Handle zip
    if (fileName.includes('.zip')) {
      // Unzip downloaded archive
      await this._unzip(fileName, this.workdir)

      // Get paths of extracted directory and binary
      const extractedDir = path.resolve(this.workdir, fs.readdirSync(this.workdir)[0])
      const extractedBin = path.resolve(extractedDir, this.bin)

      // Move geth binary from extracted directory to client's root working directory
      const movedBin = path.resolve(this.workdir, this.bin)
      fs.renameSync(extractedBin, movedBin)

      // Remove archive and extracted directory
      await remove(fileName)
      return remove(extractedDir)
    }
  }

  _run (args) {
    // Spawn child process
    this.process = execFile(this.bin, args, (err, stdout, stderr) => {
      // No errors
      if (!err) return

      // Handle 'SIGKILL'
      if (err.signal === 'SIGKILL') log.info(`${this.name}: killed`)
    })

    // Handle stdout/stderr
    this.process.stdout.on('data', (data) => this.emit('stdout', data))
    this.process.stderr.on('data', (data) => this.emit('stderr', data))

    // Handle process termination
    this.process.on('exit', (code) => {
      this.emit('exit', code)
      this.process = null
    })
  }

  _runOnce (args) {
    return new Promise((resolve, reject) => {
      execFile(this.bin, args, (err, stdout, stderr) => {
        if (!err) return resolve(stdout)
        reject(err)
      })
    })
  }

  _updateStore () {
    store.updateClient(this.name, 'installed', this.isInstalled)
    store.updateClient(this.name, 'latest', this.isLatest)
    store.updateClient(this.name, 'version', this.version)
  }

  _unzip (source, target) {
    return new Promise((resolve, reject) => {
      extractZip(source, { dir: target }, async (err) => {
        if (!err) resolve()
        else throw err
      })
    })
  }
}

module.exports = Client

// DEBUG
// const s = new Service('ipfs')
// s.on('status', console.log)
// s.init().then(console.log)
