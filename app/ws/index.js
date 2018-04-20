import provider from '../provider'
import store from '../store'

let connections = []

const allowed = (req, proceed) => {
  let obs = store.observer(_ => {
    let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
    let perms = Object.keys(permissions).map(id => permissions[id])
    let permIndex = perms.map(p => p.origin).indexOf(req.origin)
    if (permIndex === -1 && store('signer.current')) return store.addRequest({type: 'requestProvider', origin: req.origin, notice: `${req.origin} is requesting access to the provider.`})
    setTimeout(_ => obs.remove(), 0) // Add fix for this pattern in restore
    store('signer.current') && perms[permIndex].provider ? proceed(req.accept(null, req.origin)) : req.reject()
  })
}

// let WebSocket = require('ws')
// let ws = new WebSocket.Server({port: 1248})
//
// wss.on('connection', ws => {
//   ws.on('message', message => {
//     console.log('received: %s', message)
//   })
//   ws.send('something')
// })

let ws = {
  start: () => {
    let http = require('http').createServer()
    http.listen(1248)
    let WSServer = require('websocket').server
    let ws = new WSServer({httpServer: http})
    ws.on('request', req => {
      allowed(req, socket => {
        let index = connections.map(conenction => conenction.origin).indexOf(req.origin)
        if (index === -1) connections.push({origin: req.origin, socket})
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
  },
  close: origin => {
    connections = connections.filter(connection => {
      if (connection.origin === origin) {
        connection.socket.close()
        return false
      }
      return true
    })
  }
}

store.observer(() => {
  let a = store('signer.accounts', 0)
  let permissions = store('local.accounts', a, 'permissions') || {}
  Object.keys(permissions).forEach(id => {
    if (permissions[id].provider === false) if (ws.close) ws.close(permissions[id].origin)
  })
})

module.exports = ws
