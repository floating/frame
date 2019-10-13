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
  const hash = qs.parse(req.url.split('?')[1]).__hash__
  const session = qs.parse(req.url.split('?')[1]).__session__

  // If hash query, this is a request to resolve a dapp and inject it with Frame functionality
  if (hash) {
    if (!sessions.verify(hash, session)) return error(res, 403, 'You do not have permissions to access this dapp')
    asset.dapp(res, hash, session)

  // If no hash query, this is a request from the dapp itself
  } else {
    const hash = req.headers.cookie ? cookie.parse(req.headers.cookie).__hash__ : null
    const session = req.headers.cookie ? cookie.parse(req.headers.cookie).__session__ : null
    if (!sessions.verify(hash, session)) return error(res, 403, 'You do not have permissions to access this dapp')

    // GET reqests are for streaming assets
    if (req.method === 'GET') {
      asset.stream(res, `${hash}${req.url.split('?')[0]}`)

    // POST requests are updates to storage
    } else if (req.method === 'POST') {
      let state = ''
      req.on('data', data => { state += data })
      req.on('end', () => storage.update(res, hash, state))

    // Request not handled by the server
    } else {
      error(res, 404, 'No handler found for request')
    }
  }
}

http.createServer(handler).listen(8421, '127.0.0.1')

module.exports = { sessions }
