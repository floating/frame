const { http, https } = require('./http')
const ws = require('./ws')

ws(http()).listen(1248, '127.0.0.1')

// this needs to be re-initialised when a valid cert is created / selected
const httpsServer = https()
if (httpsServer) {
  ws(https()).listen(1249, '127.0.0.1')
}
