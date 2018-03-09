import provider from '../provider'

module.exports = () => {
  let http = require('http').createServer()
  http.listen(1248)
  let WSServer = require('websocket').server
  let ws = new WSServer({httpServer: http})
  ws.on('request', req => {
    let socket = req.accept(null, req.origin)
    socket.on('message', data => {
      if (data.type !== 'utf8') return
      let payload = JSON.parse(data.utf8Data)
      let handlerId = payload.handlerId
      delete payload.handlerId
      provider.sendAsync(payload, (err, res) => {
        socket.send(JSON.stringify({type: 'response', handlerId, err, res}))
      })
    })
    socket.on('close', socket => console.log('Socket Disconnect: No Reconnect Setup'))
  })
}
