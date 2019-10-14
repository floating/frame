const http = require('http')
const cookie = require('cookie')
const qs = require('querystring')

const sessions = require('./sessions')
const asset = require('./asset')
const ws = require('./ws')

const server = http.createServer((req, res) => {
  // Request from Frame to resolve dapp
  const { hash, session } = qs.parse(req.url.split('?')[1])
  if (hash && sessions.verify(hash, session)) return asset.dapp(res, hash, session)

  // Request from dapp for asset
  const { __hash, __session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
  if (sessions.verify(__hash, __session)) return asset.stream(res, `${__hash}${req.url.split('?')[0]}`)

  res.writeHead(403)
  res.end('For security reasons, please launch this app from Frame')
})

ws(server).listen(8421, '127.0.0.1')

module.exports = { sessions }
