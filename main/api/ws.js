const WebSocket = require('ws')
const uuid = require('uuid/v4')
const log = require('electron-log')

const provider = require('../provider')
const signers = require('../signers')

const trusted = require('./trusted')
const isExtension = require('./isExtension')

const subs = {}

const protectedMethods = ['eth_coinbase', 'eth_accounts', 'eth_sendTransaction', 'personal_sign', 'personal_ecRecover', 'eth_sign']

const handler = (socket, req) => {
  socket.id = uuid()
  log.info('Socket connect: ' + socket.id)
  socket.origin = req.headers.origin
  const res = payload => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload), err => { if (err) log.info(err) })
  }
  socket.on('message', data => {
    let origin = socket.origin
    let payload = JSON.parse(data)
    if (isExtension(origin) && payload.__frameOrigin) { // Request from extension, swap origin
      origin = payload.__frameOrigin
      delete payload.__frameOrigin
    }
    log.info('ws -> ' + socket.id.substr(0, 6) + ' ' + origin + ' ' + payload.method + ' ' + payload.params)
    if (protectedMethods.indexOf(payload.method) > -1 && !trusted(origin)) {
      let error = { message: 'Permission denied, approve ' + origin + ' in Frame to continue', code: -1 }
      if (!signers.getSelectedAccounts()[0]) error = { message: 'No Frame account selected', code: -1 }
      res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
    } else {
      provider.send(payload, response => {
        if (response && response.result) {
          if (payload.method === 'eth_subscribe') {
            subs[response.result] = socket
          } else if (payload.method === 'eth_unsubscribe') {
            payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
          }
        }
        res(response)
      })
    }
  })
  socket.on('error', err => err) // Handle Error
  socket.on('close', _ => {
    log.info('Socket close: ' + socket.id)
    let unsub = []
    Object.keys(subs).forEach(sub => {
      if (subs[sub].id === socket.id) {
        unsub.push(sub)
        delete subs[sub]
      }
    })
    if (unsub.length > 0) provider.unsubscribe(unsub, res => log.info('Provider Unsubscribe', res))
  })
}

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', handler)
  // Send data to the socket that initiated the subscription
  provider.on('data', payload => {
    if (subs[payload.params.subscription]) subs[payload.params.subscription].send(JSON.stringify(payload))
  })

  // TODO: close -> notify
  // If we lose connection to our node, close connected sockets
  // provider.on('close', _ => ws.clients.forEach(socket => socket.close()))
  // When permission is revoked, close connected sockets
  // store.observer(() => {
  //   let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
  //   let ok = []
  //   Object.keys(permissions).forEach(key => { if (permissions[key].provider) ok.push(permissions[key].origin) })
  //   ws.clients.forEach(socket => { if (ok.indexOf(socket.origin) < 0) socket.close() })
  // })
  // When the current account changes, close connected sockets
  // let current = ''
  // store.observer(() => {
  //   if (store('signer.current') !== current) ws.clients.forEach(socket => socket.close())
  //   current = store('signer.current')
  // })
  // let local
  // let secondary
  // store.observer(() => {
  //   if (local === 'connected' && local !== store('local.connection.local.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   } else if (secondary === 'connected' && secondary !== store('local.connection.secondary.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   }
  //   local = store('local.connection.local.status')
  //   secondary = store('local.connection.secondary.status')
  // })

  return server
}
