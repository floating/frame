const fs = require('fs')
const path = require('path')
const https = require('https')
const url = require('url')
const { execFile, execFileSync } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const tar = require('tar')
// const checksum = require('md5-file')

const latest = require('../latest.json')

let ipfs, release, ipfsBin
let cwd = path.resolve(app.getPath('userData'), 'ipfs')
if (!fs.existsSync(cwd)) fs.mkdirSync(cwd)
if (latest.ipfs.platform[process.platform]) release = latest.ipfs.platform[process.platform][process.arch]
if (release) ipfsBin = path.join(cwd, release.bin)

const api = {
  start: (options) => {
    if (!fs.existsSync(ipfsBin)) return api.update(err => { if (!err) api.start() })
    try { execFileSync(ipfsBin, ['init']) } catch (e) {}
    fs.unlink(path.resolve(app.getPath('home'), '.ipfs/api'), log.error)
    try {
      if ((execFileSync(ipfsBin, ['version']).toString().split(' ')[2].trim() !== latest.ipfs.version)) return api.update(err => err ? log.error(err) : api.start())
      execFileSync(ipfsBin, ['config', 'Addresses.Gateway', '/ip4/127.0.0.1/tcp/8421'])
    } catch (e) {
      log.error('Caught ipfs error in start setup')
      log.error(e)
      return
    }
    try {
      if (ipfs && ipfs.kill) ipfs.kill()
      log.info('Start IPFS', ipfsBin)
      ipfs = execFile(ipfsBin, ['daemon'], err => { if (err) throw err })
      ipfs.stdout.on('data', data => log.debug(`IPFS stdout: ${data}`))
      ipfs.stderr.on('data', data => log.debug(`IPFS stderr: ${data}`))
      ipfs.on('close', code => log.warn(`IPFS exited with code ${code}`))
    } catch (e) {
      log.error('Caught ipfs error in daemon')
      log.error(e)
    }
  },
  stop: () => {
    log.info('Stopping IPFS')
    log.debug('Able to ipfs.kill: ' + Boolean(ipfs && ipfs.kill))
    if (ipfs && ipfs.kill) ipfs.kill()
  },
  status: cb => {
    log.debug('Getting ipfs on/off status...')
  },
  update: (cb) => {
    if (release) {
      let file = path.join(cwd, path.basename(url.parse(release.location).pathname))
      https.get(release.location, res => {
        let save = res.pipe(fs.createWriteStream(file))
        save.on('finish', () => { // Listen for on error?
          tar.x({ file, cwd, strip: 1 }, err => {
            if (err) return cb ? cb(err) : log.error(err) // Handle
            fs.unlink(file, err => { if (cb) cb(err) })
          })
        })
      })
    } else {
      cb(new Error('Current platform/arch is not supported'))
    }
  }
}

module.exports = api
