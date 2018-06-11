import qs from 'querystring'
import { URL } from 'url'
import WebSocket from 'ws'
import uuid from 'uuid/v4'
import http from 'http'

import provider from '../provider'
import store from '../store'

const trusted = origin => {
  if (!origin || origin === 'null') origin = 'Unknown'
  let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
  let perms = Object.keys(permissions).map(id => permissions[id])
  let permIndex = perms.map(p => p.origin).indexOf(origin)
  if (permIndex === -1 && store('signer.current')) store.addRequest({type: 'requestProvider', origin})
  return store('signer.current') && store('node.provider') && perms[permIndex] && perms[permIndex].provider
}

const polls = {}
const pollSubs = {}

const httpHandler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'POST' && trusted(req.headers.origin)) {
    let body = []
    req.on('data', chunk => body.push(chunk)).on('end', () => {
      res.on('error', err => console.error('res err', err))
      let payload = JSON.parse(Buffer.concat(body).toString())
      if (payload.method === 'eth_pollSubscriptions') {
        let id = payload.params[0]
        let result = polls[id] || []
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({id: payload.id, jsonrpc: payload.jsonrpc, result}))
        return polls[id] = []
      }
      provider.send(payload, response => {
        if (response && response.result) {
          if (payload.method === 'eth_subscribe') {
            let id = payload.pollId
            polls[id] = polls[id] || []
            pollSubs[response.result] = id
          } else if (payload.method === 'eth_unsubscribe') {
            payload.params.forEach(sub => { if (pollSubs[sub]) delete pollSubs[sub] })
          }
        }
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(response))
      })
    }).on('error', err => console.error('req err', err))
  } else {
    res.writeHead(401, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({error: 'Permission Denied'}))
  }
}

const subs = {}

const wsHandler = (socket, req) => {
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

module.exports = () => {
  const verifyClient = (info, next) => next(trusted(info.origin), 401, 'Permission Denied')
  const server = http.createServer(httpHandler)
  const ws = new WebSocket.Server({server, verifyClient})
  ws.on('connection', wsHandler)
  server.listen(1248, '127.0.0.1')

  // If we lose connection to our node, close connected sockets
  provider.connection.on('close', _ => {
    ws.clients.forEach(socket => socket.close())
  })

  // Send data to the socket that initiated the subscription
  provider.on('data', payload => {
    if (subs[payload.params.subscription]) subs[payload.params.subscription].send(JSON.stringify(payload))
    if (pollSubs[payload.params.subscription]){
      let id = pollSubs[payload.params.subscription]
      polls[id] = polls[id] || []
      polls[id].push(JSON.stringify(payload))
    }
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
