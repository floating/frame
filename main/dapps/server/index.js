const fs = require('fs')
const path = require('path')
const http = require('http')
const cookie = require('cookie')
const qs = require('querystring')
const cheerio = require('cheerio')

const ipfs = require('../../clients/Ipfs')
const sessions = require('../sessions')

const inject = fs.readFileSync(path.resolve(__dirname, '../../../bundle/inject.js'), 'utf8')

const storage = {}
const updateStorage = (res, hash, session, state) => {
  if (!hash || !session || !state) {
    res.end('Storage update error')
    console.log('Storage update error: missing dapp, session or state', hash, session, state)
  } else {
    const permission = sessions.check(hash, session)
    if (permission) {
      storage[hash] = state
      res.writeHead(200)
      res.end()
    } else {
      res.end('Missing session permissions to update storage')
      console.log('Missing session permissions to update storage', hash, session, state)
    }
  }
}

const types = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  ttf: 'application/font-sfnt',
  svg: 'image/svg+xml',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png'
}

const handler = (req, res) => {
  const hash = qs.parse(req.url.split('?')[1]).hash
  if (hash) {
    const session = qs.parse(req.url.split('?')[1]).session
    if (!sessions.check(hash, session)) return res.end('Missing session permission to access app')
    ipfs.api.get(`${hash}/index.html`, (err, files) => {
      if (err) return res.end('Error resolving dapp index: ' + err.message)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.setHeader('Set-Cookie', [`_hash=${hash}`, `_session=${session}`])
      const root = cheerio.load(files[0].content.toString('utf8'))
      root('html').prepend(`
        <script>
          window.__storage__ = ${JSON.stringify(storage[hash] || {})}
          ${inject}
        </script>
      `)
      res.end(root.html())
    })
  } else {
    const hash = req.headers.cookie ? cookie.parse(req.headers.cookie)._hash : null
    const session = req.headers.cookie ? cookie.parse(req.headers.cookie)._session : null
    if (!hash || !session) return res.end(`Dapp or session missing, hash: ${hash}, session: ${session}`)
    if (req.method === 'POST') {
      let state = ''
      req.on('data', data => { state += data })
      req.on('end', () => {
        try { updateStorage(res, hash, session, JSON.parse(state)) } catch (e) { res.end() }
      })
    } else {
      const path = `${hash}${req.url.split('?')[0]}`
      ipfs.api.getReadableStream(path).on('data', file => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
        const ext = path.substr(path.lastIndexOf('.') + 1)
        res.setHeader('content-type', types[ext] || 'text/plain')
        file.content.on('data', data => res.write(data))
        file.content.once('end', () => res.end())
      })
    }
  }
}

http.createServer(handler).listen(8421, '127.0.0.1')
