const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const ipfs = require('../../../clients/Ipfs')
const storage = require('../storage')
const getType = require('./getType')
const inject = fs.readFileSync(path.resolve(__dirname, '../../../../bundle/inject.js'), 'utf8')

const error = (res, code, message) => {
  res.writeHead(code)
  res.end(message)
}

module.exports = {
  stream: (res, path) => { // Stream assets from IPFS back to the client
    ipfs.api.getReadableStream(path).on('data', file => {
      res.setHeader('content-type', getType(path))
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      file.content.on('data', data => res.write(data))
      file.content.once('end', () => res.end())
    })
  },
  dapp: (res, hash, session) => { // Resolve dapp via IPFS, inject functionality and send it back to the client
    ipfs.api.get(`${hash}/index.html`, (err, files) => {
      if (err) return error(res, 404, 'Could not resolve dapp: ' + err.message)
      res.setHeader('Set-Cookie', [`_hash=${hash}`, `_session=${session}`])
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      const $ = cheerio.load(files[0].content.toString('utf8'))
      $('html').prepend(`
        <script>
          window.__storage__ = ${JSON.stringify(storage.get(hash) || {})}
          ${inject}
        </script>
      `)
      res.end($.html())
    })
  }
}
