import WebSocket from 'ws'
import uuid from 'uuid/v4'

import provider from '../provider'
import store from '../store'

import trusted from './trusted'

const subs = {}

const handler = (socket, req) => {
  socket.id = uuid()
  socket.origin = req.headers.origin
  socket.on('message', data => {
    let payload = JSON.parse(data)
    provider.send(payload, response => {
      if (response && response.result) {
        if (payload.method === 'eth_subscribe') {
          subs[response.result] = socket
        } else if (payload.method === 'eth_unsubscribe') {
          payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
        }
      }
      socket.send(JSON.stringify(response), err => { if (err) console.log(err) })
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
}

export default (server) => {
  const ws = new WebSocket.Server({server, verifyClient: (info, next) => next(trusted(info.origin), 401, 'Permission Denied')})
  ws.on('connection', handler)
  // If we lose connection to our node, close connected sockets
  provider.connection.on('close', _ => ws.clients.forEach(socket => socket.close()))
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
  return server
}
