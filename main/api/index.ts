import http from './http'
import ws from './ws'

console.log(' &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& LISTENING FOR HTTP ..... ')

ws(http()).listen(1248, '127.0.0.1')
