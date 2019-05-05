const fs = require('fs')
const path = require('path')
const https = require('https')
const url = require('url')
const { execFile } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const tar = require('tar')
const checksum = require('md5-file')

const latest = require('../latest.json')

let geth, release, gethBin
let cwd = path.resolve(app.getPath('userData'), 'geth')
if (!fs.existsSync(cwd)) fs.mkdirSync(cwd)
if (latest.geth.platform[process.platform]) release = latest.geth.platform[process.platform][process.arch]
if (release) gethBin = path.join(cwd, release.bin)

const api = {
  start: (network) => {
    if (!fs.existsSync(gethBin)) return api.update(err => err ? log.error(err) : api.start())
    execFile(gethBin, ['version'], (err, stdout, stderr) => {
      if (err) return log.error(err) // Update Status
      if ((stdout.split('\n')[1].split(':')[1].split('-')[0].trim() !== latest.geth.version)) return api.update(err => err ? log.error(err) : api.start())
      try {
        if (geth && geth.kill) geth.kill()
        log.info('Start Geth', gethBin)
        geth = execFile(gethBin, ['--networkid', '4', '--rinkeby', '--nousb', '--identity', 'Frame', '--syncmode', 'light'], err => { if (err) throw err })
        geth.stdout.on('data', data => log.debug(`Geth stdout: ${data}`))
        geth.stderr.on('data', data => log.debug(`Geth stderr: ${data}`))
        geth.on('close', code => log.warn(`Geth exited with code ${code}`))
      } catch (e) {
        log.error('Caught geth error')
        log.error(e)
      }
    })
  },
  stop: () => {
    log.info('Stopping Geth')
    log.debug('Able to geth.kill: ' + Boolean(geth && geth.kill))
    if (geth && geth.kill) geth.kill()
  },
  status: cb => {
    log.debug('Getting geth on/off status...')
  },
  update: (cb) => {
    if (release) {
      let file = path.join(cwd, path.basename(url.parse(release.location).pathname))
      https.get(release.location, res => {
        let save = res.pipe(fs.createWriteStream(file))
        save.on('finish', () => {
          checksum(file, (err, hash) => { // Update to sha256 when geth does
            if (err) return cb ? cb(err) : log.error(err)
            if (hash === release.checksum) {
              tar.x({file, cwd, strip: 1}, err => {
                if (err) return cb ? cb(err) : log.error(err) // Handle
                fs.unlink(file, err => { if (cb) cb(err) })
              })
            } else {
              let err = new Error(`Geth checksum did not match, expecting ${release.checksum} and got ${hash}`)
              cb(err)
              log.error(err)
              fs.unlink(file, err => { if (err) log.error(err) })
            }
          })
        })
      })
    } else {
      cb(new Error('Current platform/arch is not supported'))
    }
  }
}

module.exports = api
