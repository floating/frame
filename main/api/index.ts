import http from './http'
import ws from './ws'

ws(http()).listen(1248, '127.0.0.1')
