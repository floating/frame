const http = require('http')
const cookie = require('cookie')
const qs = require('querystring')

const sessions = require('./sessions')
const storage = require('./storage')
const asset = require('./asset')

const error = (res, code, message) => {
  res.writeHead(code)
  res.end(message)
}

const handler = (req, res) => {
  const { hash, session } = qs.parse(req.url.split('?')[1])
  if (hash) { // If hash query, this is a request to resolve a dapp and inject it with Frame functionality
    if (!sessions.verify(hash, session)) return error(res, 403, 'You do not have permissions to access this dapp')
    asset.dapp(res, hash, session)
  } else { // If no hash query, this is a request from the dapp itself for an asset
    const { _hash, _session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
    if (!sessions.verify(_hash, _session)) return error(res, 403, 'You do not have permissions to access this dapp')
    if (req.method === 'GET') { // GET reqests are for streaming assets
      asset.stream(res, `${_hash}${req.url.split('?')[0]}`)
    } else if (req.method === 'POST') { // POST requests are updates to storage
      let state = ''
      req.on('data', data => { state += data })
      req.on('end', () => storage.update(res, _hash, state))
    } else { // Request method not handled by the server
      error(res, 404, 'No handler found for request')
    }
  }
}

http.createServer(handler).listen(8421, '127.0.0.1')

module.exports = { sessions }
