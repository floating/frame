import WebSocket from 'ws'

import provider from '../provider'
import store from '../store'

module.exports = () => {
  const verifyClient = (info, next) => {
    let obs = store.observer(_ => {
      let origin = info.origin
      let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
      let perms = Object.keys(permissions).map(id => permissions[id])
      let permIndex = perms.map(p => p.origin).indexOf(origin)
      if (permIndex === -1 && store('signer.current')) return store.addRequest({type: 'requestProvider', origin, notice: `${origin} is requesting access to the provider.`})
      setTimeout(_ => obs.remove(), 0) // Add fix for this pattern in restore
      next(store('signer.current') && perms[permIndex].provider)
    })
  }

  const ws = new WebSocket.Server({port: 1248, clientTracking: true, verifyClient})

  ws.on('connection', (socket, req) => {
    socket.origin = req.headers.origin
    socket.send(JSON.stringify({type: 'accounts', accounts: store('signer.accounts')}))
    socket.on('message', data => {
      let payload = JSON.parse(data)
      let handlerId = payload.handlerId
      delete payload.handlerId
      provider.sendAsync(payload, (err, res) => {
        socket.send(JSON.stringify({type: 'response', handlerId, err, res}))
      })
    })
    socket.on('close', socket => console.log('Socket Disconnect'))
    socket.on('error', error => console.log('Socket Error', error))
  })

  store.observer(() => {
    let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
    Object.keys(permissions).forEach(key => {
      let permission = permissions[key]
      let ok = []
      if (permission.provider) ok.push(permission.origin)
      ws.clients.forEach(socket => { if (ok.indexOf(socket.origin) < 0) socket.close() })
    })
  })

  store.observer(() => {
    store('signer.accounts')
    ws.clients.forEach(socket => socket.close())
  })
}
