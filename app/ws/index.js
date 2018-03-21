import provider from '../provider'
import store from '../store'

const allowed = (req, proceed) => {
  let obs = store.observer(_ => {
    let permissions = store('permissions', req.origin.replace('.', ''))
    if (!permissions) return store.addRequest({type: 'requestProvider', origin: req.origin, notice: `${req.origin} is requesting access to the provider.`})
    setTimeout(_ => obs.remove(), 0) // Add fix for this pattern in restore
    permissions.provider ? proceed(req.accept(null, req.origin)) : req.reject()
  })
}
module.exports = () => {
  let http = require('http').createServer()
  http.listen(1248)
  let WSServer = require('websocket').server
  let ws = new WSServer({httpServer: http})
  ws.on('request', req => {
    allowed(req, socket => {
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
  })
}
