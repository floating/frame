const http = require('./http')
const ws = require('./ws')

ws(http()).listen(1248, '127.0.0.1')
