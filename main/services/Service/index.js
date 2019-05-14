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
    this.version = fs.existsSync(this.versionFile) && fs.readFileSync(this.versionFile, 'utf8')
    this.latest = latest[this.name]
  }

  async init () {
    // If working directory doesn't exist -> create it
    if (!fs.existsSync(this.workdir)) fs.mkdirSync(this.workdir)

    // If current version doesn't exist or is out of date -> update
    if (!this.version || semver.gt(this.latest.version, this.version)) {
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

        // Emit status
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
}

const s = new Service('ipfs')
s.on('status', console.log)
s.init().then(console.log)