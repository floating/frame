const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const ipfs = require('../../../clients/Ipfs')

const resolve = require('../resolve')
const storage = require('../storage')

const getType = require('./getType')

const inject = fs.readFileSync(path.resolve(__dirname, '../../../../bundle/inject.js'), 'utf8')

const error = (res, code, message) => {
  res.writeHead(code || 404)
  res.end(message)
}

module.exports = {
  stream: async (res, app, path) => { // Stream assets from IPFS back to the client
    if (!ipfs.api) return error(res, 404, 'IPFS client not running')
    const stream = ipfs.api.getReadableStream(`${await resolve.cid(app)}${path}`)
    stream.on('data', file => {
      if (!file) return error(res, 404, 'Asset not found')
      res.setHeader('content-type', getType(path))
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      file.content.on('data', data => res.write(data))
      file.content.once('end', () => res.end())
    })
    stream.on('error', err => error(res, err.statusCode, `For security reasons, please launch this app from Frame\n\n(${err.message})`))
  },
  dapp: async (res, app, session) => { // Resolve dapp via IPFS, inject functionality and send it back to the client
    if (!ipfs.api) return error(res, 404, 'IPFS client not running')
    console.log('appppp: ', app)
    const cid = await resolve.cid(app)
    ipfs.api.get(`${cid}/index.html`, (err, files) => {
      console.log('err here?', err, cid)
      if (err) return error(res, 404, 'Could not resolve dapp: ' + err.message)
      res.setHeader('Set-Cookie', [`__app=${app}`, `__session=${session}`])
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      const $ = cheerio.load(files[0].content.toString('utf8'))
      $('html').prepend(`
        <script>
          const initial = ${JSON.stringify(storage.get(cid) || {})}
          ${inject}
        </script>
      `)
      res.end($.html())
    })
  }
}
