const { http, https } = require('./http')
const ws = require('./ws')
let wsHttp
let wsHttps

module.exports = {
  init: () => {
    if (wsHttp === undefined) {
      wsHttp = ws(http()).listen(1248, '127.0.0.1')
    }

    console.log('init, innit')
    if (wsHttps === undefined) {
      const httpsServer = https()
      console.log('got https server')
      if (httpsServer) {
        console.log('listening ws')
        wsHttps = ws(https()).listen(1249, '127.0.0.1')
      }
    }
  }
}
