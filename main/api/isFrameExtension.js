const queryString = require('query-string')

const dev = process.env.NODE_ENV === 'development'

module.exports = req => {
  const origin = req.headers.origin
  if (!origin) return false
  const query = queryString.parse(req.url.replace('/', ''))

  // Match production extension ids exactly
  if (
    origin === 'chrome-extension://ldcoohedfbjoobcadoglnnmmfbdlmmhf' || // production chrome
    origin === 'moz-extension://bd0560a2-8c13-4cb4-a856-eceab7e771d8', // production firefox
    origin === 'safari-web-extension://7655eadc-658f-4faf-b22c-bff822d0154e' // production safari
  ) {
    return true
  }

  // If in dev mode, match any extension where query.identity === 'frame-extension'
  if (dev) {
    if (
      origin.startsWith('chrome-extension://') > -1 || 
      origin.startsWith('moz-extension://') > -1 ||
      origin.startsWith('safari-web-extension://')
    ) {
      return query.identity === 'frame-extension'
    }
  }

  return false
}
