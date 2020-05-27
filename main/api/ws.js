const WebSocket = require('ws')
const { v4: uuid } = require('uuid')
const log = require('electron-log')

const provider = require('../provider')
const accounts = require('../accounts')
const store = require('../store')

const trusted = require('./trusted')
const validPayload = require('./validPayload')
const isFrameExtension = require('./isFrameExtension')

const logTraffic = process.env.LOG_TRAFFIC

const subs = {}

const protectedMethods = ['eth_coinbase', 'eth_accounts', 'eth_requestAccounts','eth_sendTransaction', 'personal_sign', 'personal_ecRecover', 'eth_sign']

const handler = (socket, req) => {
  socket.id = uuid()
  socket.origin = req.headers.origin
  socket.isFrameExtension = isFrameExtension(req)
  const res = payload => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload), err => { if (err) log.info(err) })
    }
  }
  socket.on('message', async data => {
    let origin = socket.origin
    const payload = validPayload(data)
    if (!payload) return console.warn('Invalid Payload', data)
    if (socket.isFrameExtension) { // Request from extension, swap origin
      if (payload.__frameOrigin) {
        origin = payload.__frameOrigin
        delete payload.__frameOrigin
      } else {
        origin = 'frame-extension'
      }
    }
    if (logTraffic) log.info('req -> | ' + (socket.isFrameExtension ? 'ext | ' : 'ws | ') + origin + ' | ' + payload.method + ' | -> | ' + payload.params)
    try {
      if (protectedMethods.indexOf(payload.method) > -1 && !(await trusted(origin))) {
        let error = { message: 'Permission denied, approve ' + origin + ' in Frame to continue', code: 4001 }
        if (!accounts.getSelectedAddresses()[0]) error = { message: 'No Frame account selected', code: 4100 }
        res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
      } else {
        payload._origin = origin
        provider.send(payload, response => {
          if (response && response.result) {
            if (payload.method === 'eth_subscribe') {
              subs[response.result] = { socket, origin }
            } else if (payload.method === 'eth_unsubscribe') {
              payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
            }
          }
          if (logTraffic) log.info('<- res | ' + (socket.isFrameExtension ? 'ext | ' : 'ws | ') + origin + ' | ' + payload.method + ' | <- | ' + response.result || response.error)
          res(response)
        })
      }
    } catch (e) {
      res({ id: payload.id, jsonrpc: payload.jsonrpc, error: { message: e.message, code: 4100 } })
    }
  })
  socket.on('error', err => err) // Handle Error
  socket.on('close', _ => {
    Object.keys(subs).forEach(sub => {
      if (subs[sub].socket.id === socket.id) {
        provider.send({ jsonrpc: '2.0', id: 1, method: 'eth_unsubscribe', params: [sub] })
        delete subs[sub]
      }
    })
  })
}

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', handler)
  // Send data to the socket that initiated the subscription
  provider.on('data', payload => {
    const subscription = subs[payload.params.subscription]
    if (subscription) subscription.socket.send(JSON.stringify(payload))
  })

  provider.on('data:accounts', (account, payload) => { // Make sure the subscription has access based on current account
    const subscription = subs[payload.params.subscription]
    if (subscription) {
      const permissions = store('main.accounts', account, 'permissions') || {}
      const perms = Object.keys(permissions).map(id => permissions[id])
      perms.push({ origin: 'http://localhost:8421', provider: true })
      let origin = subscription.origin
      if (!origin || origin === 'null') origin = 'Unknown'
      const allowed = perms.map(p => p.origin).indexOf(origin) > -1
      if (!allowed) payload.params.result = []
      subscription.socket.send(JSON.stringify(payload))
    }
  })

  // TODO: close -> notify
  // If we lose connection to our node, close connected sockets
  // provider.on('close', _ => ws.clients.forEach(socket => socket.close()))
  // When permission is revoked, close connected sockets
  // store.observer(() => {
  //   let permissions = store('local.accounts', store('selected.accounts', 0), 'permissions') || {}
  //   let ok = []
  //   Object.keys(permissions).forEach(key => { if (permissions[key].provider) ok.push(permissions[key].origin) })
  //   ws.clients.forEach(socket => { if (ok.indexOf(socket.origin) < 0) socket.close() })
  // })
  // When the current account changes, close connected sockets
  // let current = ''
  // store.observer(() => {
  //   if (store('selected.current') !== current) ws.clients.forEach(socket => socket.close())
  //   current = store('selected.current')
  // })
  // let local
  // let secondary
  // store.observer(() => {
  //   if (local === 'connected' && local !== store('main.connection.local.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   } else if (secondary === 'connected' && secondary !== store('main.connection.secondary.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   }
  //   local = store('main.connection.local.status')
  //   secondary = store('main.connection.secondary.status')
  // })

  return server
}
