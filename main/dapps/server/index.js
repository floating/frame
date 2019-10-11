const fs = require('fs')
const path = require('path')
const http = require('http')
const cookie = require('cookie')
const qs = require('querystring')
const cheerio = require('cheerio')

const { userData } = require('../../util')

const sessions = require('../sessions')

const asset = require('./asset')

const dapps = path.resolve(userData, 'dapps')
const inject = fs.readFileSync(path.resolve(__dirname, '../../../bundle/inject.js'), 'utf8')

const storage = {}
const updateStorage = (res, dapp, session, state) => {
  if (!dapp || !session || !state) {
    res.end('Storage update error')
    console.log('Storage update error: missing dapp, session or state', dapp, session, state)
  } else {
    const permission = sessions.check(dapp, session)
    if (permission) {
      storage[dapp] = state
      res.writeHead(200)
      res.end()
    } else {
      res.end('Missing session permissions to update storage')
      console.log('Missing session permissions to update storage', dapp, session, state)
    }
  }
}

const handler = (req, res) => {
  const app = qs.parse(req.url.split('?')[1]).app
  if (app) {
    const session = qs.parse(req.url.split('?')[1]).session
    if (!sessions.check(app, session)) return res.end('Missing session permission to access app')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Set-Cookie', [`_dapp=${app}`, `_session=${session}`])
    fs.readFile(dapps + '/' + app + '/' + 'index.html', 'utf8', (err, html) => {
      if (err) return res.end('Error rendering dapp: ' + err.message)
      const root = cheerio.load(html)
      root('html').prepend(`
        <script>
          window.__storage__ = ${JSON.stringify(storage[app] || {})}
          ${inject}
        </script>
        `)
      res.end(root.html())
    })
  } else {
    const dapp = req.headers.cookie ? cookie.parse(req.headers.cookie)._dapp : null
    const session = req.headers.cookie ? cookie.parse(req.headers.cookie)._session : null
    if (!dapp || !session) return res.end(`Dapp or session missing, dapp: ${dapp}, session: ${session}`)
    if (req.method === 'POST') {
      let state = ''
      req.on('data', data => { state += data })
      req.on('end', () => {
        try { updateStorage(res, dapp, session, JSON.parse(state)) } catch (e) { res.end() }
      })
    } else {
      const locator = req.url.split('?')[0].split('/').filter(o => ['', '.', '..'].indexOf(o) === -1)
      asset(res, dapps + '/' + dapp + '/' + locator.join('/'))
    }
  }
}
http.createServer(handler).listen(8421, '127.0.0.1')
