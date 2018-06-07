import qs from 'querystring'
import { URL } from 'url'
import WebSocket from 'ws'
import uuid from 'uuid/v4'

import provider from '../provider'
import store from '../store'

module.exports = () => {
  const verifyClient = (info, next) => {
    store.observer(function () {
      let origin = info.origin
      if (!origin || origin === 'null') origin = 'Unknown'
      let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
      let perms = Object.keys(permissions).map(id => permissions[id])
      let permIndex = perms.map(p => p.origin).indexOf(origin)
      let url = new URL('ws://' + info.req.headers.host + info.req.url)
      let search = qs.parse(url.search.replace(/^\?+/g, ''))
      let quiet = !search.mode ? false : search.mode === 'quiet'
      if (permIndex === -1 && store('signer.current') && !quiet) return store.addRequest({type: 'requestProvider', origin})
      this.remove()
      next(store('signer.current') && store('node.provider') && perms[permIndex] && perms[permIndex].provider, 401, 'Permission Denied')
    })
  }
  const ws = new WebSocket.Server({port: 1248, verifyClient})
  const subs = {}

  ws.on('connection', (socket, req) => {
    socket.id = uuid()
    socket.origin = req.headers.origin
    socket.on('message', data => {
      let payload = JSON.parse(data)
      provider.send(payload, res => {
        if (res && res.result) {
          if (payload.method === 'eth_subscribe') {
            subs[res.result] = socket
          } else if (payload.method === 'eth_unsubscribe') {
            payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
          }
        }
        socket.send(JSON.stringify(res), err => { if (err) console.log(err) })
      })
    })
    socket.on('error', err => err) // Handle Error
    socket.on('close', _ => {
      let unsub = []
      Object.keys(subs).forEach(sub => {
        if (subs[sub].id === socket.id) {
          unsub.push(sub)
          delete subs[sub]
        }
      })
      if (unsub.length > 0) provider.unsubscribe(unsub, res => console.log('Provider Unsubscribe', res))
    })
  })

  // If we lose connection to our node, close connected sockets
  provider.connection.on('close', _ => {
    ws.clients.forEach(socket => socket.close())
  })

  // Send data to the socket that initiated the subscription
  provider.on('data', payload => {
    if (subs[payload.params.subscription]) subs[payload.params.subscription].send(JSON.stringify(payload))
  })

  // When permission is revoked, close connected sockets
  store.observer(() => {
    let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
    let ok = []
    Object.keys(permissions).forEach(key => { if (permissions[key].provider) ok.push(permissions[key].origin) })
    ws.clients.forEach(socket => { if (ok.indexOf(socket.origin) < 0) socket.close() })
  })

  // When the current account changes, close connected sockets
  let current = ''
  store.observer(() => {
    if (store('signer.current') !== current) ws.clients.forEach(socket => socket.close())
    current = store('signer.current')
  })
}
