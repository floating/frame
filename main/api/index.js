const { http, https } = require('./http')
const ws = require('./ws')
let wsHttp
let wsHttps

module.exports = {
  init: () => {
    if (wsHttp === undefined) {
      wsHttp = ws(http()).listen(1248, '127.0.0.1')
    }

    if (wsHttps === undefined) {
      const httpsServer = https()
      if (httpsServer) {
        wsHttps = ws(https()).listen(1249, '127.0.0.1')
      }
    }
  }
}
