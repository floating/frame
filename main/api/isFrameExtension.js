const queryString = require('query-string')

const dev = process.env.NODE_ENV === 'development'

module.exports = req => {
  const origin = req.headers.origin
  if (!origin) return false
  const query = queryString.parse(req.url.replace('/', ''))

  const mozOrigin = origin.startsWith('moz-extension://') 
  const extOrigin = origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://') || origin.startsWith('safari-web-extension://')

  if (origin === 'chrome-extension://ldcoohedfbjoobcadoglnnmmfbdlmmhf') { // Match production chrome
    return true
  } else if (mozOrigin || (dev && extOrigin)) {
    // In production, match any Firefox extension origin where query.identity === 'frame-extension'
    // In dev, match any extension where query.identity === 'frame-extension'
    return query.identity === 'frame-extension'
  } else {
    return false
  }
}
