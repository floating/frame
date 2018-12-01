let WebSocket = require('ws')
let ws = new WebSocket('ws://localhost:1248')

ws.on('open', () => {
  ws.send(JSON.stringify({ method: 'eth_accounts' }))
})
