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
    // Log
    log.info(`${this.name}: installing`)

    // Set state to 'installing'
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
        // Extract archive
        await this._extract(fileName)

        // Delete archive
        await remove(fileName)

        // Update version file
        fs.writeFileSync(this.versionFile, this.latest.version)

        // Emit state and update store
        this.emit('state', 'off')
        this._updateStore()

        // Emit event
        this.emit('installed')

        // Log
        log.info(`${this.name}: installed`)
      })
    })
  }

  async uninstall () {
    // Remove client dir and files wihtin
    await remove(this.workdir)
    // Update store
    this._updateStore()
    // Emit state
    this.emit('state', 'off')
    // Log
    log.info(`${this.name}: uninstalled`)
  }

  _start () {
    // Log
    log.info(`${this.name}: starting`)
    // Emit state
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
    // Make sure client is running
    if (!this.process) return

    // On exit -> set state to 'off'
    this.once('exit', (code) => {
      log.info(`${this.name}: off`)
      log.info(`${this.name}: exit code ${code}`)
      store.setClientState(this.name, 'off')
    })

    // Send 'SIGTERM' to client process
    this.process.kill()

    // Set state to 'terminating'
    this.emit('state', 'terminating')

    // Log
    log.info(`${this.name}: terminating`)
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
      // Unzip downloaded zip 
      await this._unzip(fileName, this.workdir)          
      // Get paths of extracted directory and binary
      const extractedDir = path.resolve(this.workdir, fs.readdirSync(this.workdir)[0])
      const extractedBin = path.resolve(extractedDir, 'geth.exe')
      // Move geth binary from extracted directory to client's root working directory
      const movedBin = path.resolve(this.workdir, 'geth.exe')
      fs.renameSync(extractedBin, movedBin)
      // Remove extracted directory
      return remove(extractedDir)
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
module.exports = Service

// DEBUG
// const s = new Service('ipfs')
// s.on('status', console.log)
// s.init().then(console.log)
