const queryString = require('query-string')

module.exports = req => {
  const origin = req.headers.origin
  if (!origin) return false
  const query = queryString.parse(req.url.replace('/', ''))
  if (origin.indexOf('chrome-extension://') > -1 || origin.indexOf('moz-extension://') > -1) return query.identity === 'frame-extension'
  return false
}
