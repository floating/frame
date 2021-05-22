const http = require('http')
const cookie = require('cookie')

const sessions = require('./sessions')
const asset = require('./asset')
const ws = require('./ws')

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const app = url.hostname.replace('.localhost', '')
  // check if dapp is added before progressing 
  // res.writeHead(403)
  // res.end('No dapp session, launch this dapp from Frame')
  if (url.pathname === '/') {
    return asset.dapp(res, app)
  } else {
    return asset.stream(res, app, url.pathname)
  }
  // const [app, session] = (url.searchParams.get('dapp') || '').split(':')
  // if (app && session) {
  //   if (sessions.verify(app, session)) return asset.dapp(res, app, session)
  // } else {
  //   const { __app, __session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
  //   if (sessions.verify(__app, __session)) return asset.stream(res, __app, url.pathname)
  // }
})

ws(server).listen(8421, '127.0.0.1')

module.exports = { sessions }
