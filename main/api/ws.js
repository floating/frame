const WebSocket = require('ws')
const uuid = require('uuid/v4')

const store = require('../store')
const trusted = require('./trusted')
const provider = require('../provider')

const subs = {}

const protectedMethods = ['eth_coinbase', 'eth_accounts', 'eth_sendTransaction', 'net_version', 'personal_sign', 'personal_ecRecover', 'eth_sign']
const extOrigins = ['chrome-extension://adpbaaddjmehiidelapmmnjpmehjiifg', 'moz-extension://fc369fbc-e505-e14f-a079-fe23932d9044']

const handler = (socket, req) => {
  socket.id = uuid()
  socket.origin = req.headers.origin
  socket.on('message', data => {
    let origin = socket.origin
    let payload = JSON.parse(data)
    if (extOrigins.indexOf(origin) > -1) { // request from extension swap origin
      origin = payload.__frameOrigin
      delete payload.__frameOrigin
    }
    if (protectedMethods.indexOf(payload.method) > -1 && !trusted(socket.origin)) {
      let response = { id: payload.id, jsonrpc: payload.jsonrpc, error: { message: 'Permission Denied', code: -1 } }
      socket.send(JSON.stringify(response), err => { if (err) console.log(err) })
    } else {
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
    }
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

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  // verifyClient: (info, next) => next(trusted(info.origin), 401, 'Permission Denied')
  ws.on('connection', handler)
  // If we lose connection to our node, close connected sockets
  provider.on('close', _ => ws.clients.forEach(socket => socket.close()))
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

  let local
  let secondary
  store.observer(() => {
    if (local === 'connected' && local !== store('local.connection.local.status')) {
      ws.clients.forEach(socket => socket.close())
    } else if (secondary === 'connected' && secondary !== store('local.connection.secondary.status')) {
      ws.clients.forEach(socket => socket.close())
    }
    local = store('local.connection.local.status')
    secondary = store('local.connection.secondary.status')
  })

  return server
}
