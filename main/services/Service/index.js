const EventEmitter = require('events')
const fs = require('fs')
const https = require('https')
const url = require('url')
const path = require('path')
const { app } = require('electron')
const semver = require('semver')
const { execFile } = require('child_process')
const tar = require('tar')
const unzip = require('extract-zip')
const latest = require('../latest.json')

class Service extends EventEmitter { 

  constructor (name) {
    super()
    this.name = name
    this.workdir = path.resolve('./', name) // path.resolve(app.getPath('userData'), name)
    this.versionFile = path.resolve(this.workdir, '.version')
    this.latest = latest[this.name]
    this.release = this.latest.platform[process.platform][process.arch]
    this.bin = path.resolve(this.workdir, this.release.bin)
  }

  // Getters
  get version () { return fs.existsSync(this.versionFile) && fs.readFileSync(this.versionFile, 'utf8') }
  get isInstalled () { return fs.existsSync(this.versionFile) }
  get isLatest () { return !(semver.gt(this.latest.version, this.version || '0.0.0')) }

  async init () {
    // If working directory doesn't exist -> create it
    if (!fs.existsSync(this.workdir)) fs.mkdirSync(this.workdir)

    // If client isn't installed or version out of date -> update
    if (!this.isInstalled || !this.isLatest) {
      this.on('updated', () => this.emit('ready'))
      this.update()
    } else {
      this.emit('ready')
    }  
  }

  update () {
    // Emit status
    this.emit('updating')
    
    // Get release metadata by device platform and architecture
    const release = this.latest.platform[process.platform][process.arch]
    if (!release) cb(new Error('Could not find release matching platform and architecture'))
    const fileName = path.resolve(this.workdir, release.location.split('/').pop())

    // Get archive from release store
    https.get(release.location, (res) => {
      let stream = fs.createWriteStream(fileName)
      let file = res.pipe(stream)
      console.log(`Downloading ${this.name} client`)
      
      file.on('finish', async () => {
        // Extract archive in working directory
        await this._extract(fileName)
        
        // Remove archive
        fs.unlinkSync(fileName)

        // Update version file
        fs.writeFileSync(this.versionFile, this.latest.version)

        // Update install status
        this.isInstalled = true

        // Emit event
        this.emit('updated')
      })
    })
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
    let proc = execFile(this.bin, args, (err, stdout, stderr) => {
      if (err) this.emit('error', err)
      if (stdout) this.emit('stdout', stdout)
      if (stderr) this.emit('stderr', stderr)
    })
    proc.stdout.on('data', (data) => this.emit('stdout', data))
    proc.stderr.on('data', (data) => this.emit('stderr', data))
    proc.on('close', (code) => this.emit('close', code))
  }

  _runOnce (args, cb) {
    execFile(this.bin, args, cb).stdout.on('data', console.log)
  }

}

module.exports = Service

// DEBUG
// const s = new Service('ipfs')
// s.on('status', console.log)
// s.init().then(console.log)