const WebSocket = require('ws')
const { v4: uuid, v5: uuidv5 } = require('uuid')
const log = require('electron-log')

const provider = require('../provider').default
const accounts = require('../accounts').default
const store = require('../store').default
const windows = require('../windows')

const trusted = require('./trusted')
const validPayload = require('./validPayload').default
const isFrameExtension = require('./isFrameExtension')
const protectedMethods = require('./protectedMethods').default

const logTraffic = process.env.LOG_TRAFFIC

const subs = {}

function updateOrigin (payload, origin) {
  if (!origin) {
    log.warn(`Received payload with no origin: ${payload.method}`)

    //log.warn(`Received payload with no origin: ${JSON.stringify(payload)}`)
    return { ...payload, chainId: payload.chainId || '0x1' }
  }
  
  const originId = uuidv5(origin, uuidv5.DNS)
  const existingOrigin = store('main.origins', originId)

  if (!existingOrigin && !payload.__extensionConnecting) {
    // the extension will attempt to send messages (eth_chainId and net_version) in order
    // to connect. we don't want to store these origins as they'll come from every site
    // the user visits in their browser
    store.initOrigin(originId, {
      name: origin,
      chain: {
        id: 1,
        type: 'ethereum'
      }
    })
  }
  
  return {
    ...payload,
    chainId: payload.chainId || ('0x' + (existingOrigin && existingOrigin.chain.id) || 1).toString(16),
    _origin: originId
  }
}


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
    const rawPayload = validPayload(data)
    if (!rawPayload) return console.warn('Invalid Payload', data)
    if (socket.isFrameExtension) { // Request from extension, swap origin
      if (rawPayload.__frameOrigin) {
        origin = rawPayload.__frameOrigin
        delete rawPayload.__frameOrigin
      } else {
        origin = 'frame-extension'
      }
    }

    const payload = updateOrigin(rawPayload, origin)

    // Extension custom action for summoning Frame
    if (origin === 'frame-extension' && payload.method === 'frame_summon') return windows.trayClick(true)
    if (logTraffic) log.info('req -> | ' + (socket.isFrameExtension ? 'ext | ' : 'ws | ') + origin + ' | ' + payload.method + ' | -> | ' + payload.params)

    if (protectedMethods.indexOf(payload.method) > -1 && !(await trusted(origin))) {
      let error = { message: 'Permission denied, approve ' + origin + ' in Frame to continue', code: 4001 }
      // review
      if (!accounts.getSelectedAddresses()[0]) error = { message: 'No Frame account selected', code: 4001 }
      res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
    } else {
      provider.send(payload, response => {
        if (response && response.result) {
          if (payload.method === 'eth_subscribe') {
            subs[response.result] = { socket, originId: payload._origin }
          } else if (payload.method === 'eth_unsubscribe') {
            payload.params.forEach(sub => { if (subs[sub]) delete subs[sub] })
          }
        }
        if (logTraffic) log.info('<- res | ' + (socket.isFrameExtension ? 'ext | ' : 'ws | ') + origin + ' | ' + payload.method + ' | <- | ' + (JSON.stringify(response.result || response.error)))

        res(response)
      })
    }
  })
  socket.on('error', err => log.error(err))
  socket.on('close', _ => {
    Object.keys(subs).forEach(sub => {
      if (subs[sub].socket.id === socket.id) {
        provider.send({ jsonrpc: '2.0', id: 1, method: 'eth_unsubscribe', _origin: subs[sub].originId, params: [sub] })
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

    // if an origin is passed, make sure the subscription is from that origin
    if (subscription && (!payload.params.origin || payload.params.origin === subscription.originId)) {
      subscription.socket.send(JSON.stringify(payload))
    }
  })

  provider.on('data:address', (address, payload) => { // Make sure the subscription has access based on current account
    const subscription = subs[payload.params.subscription]
    if (subscription) {
      const permissions = store('main.permissions', address) || {}
      const permission = Object.values(permissions).find(({ origin }) => {
        const originId = uuidv5(origin, uuidv5.DNS)
        return originId === subscription.originId
      }) || {}

      if (!permission.provider) payload.params.result = []
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
  //   if (local === 'connected' && local !== store('main..connection.local.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   } else if (secondary === 'connected' && secondary !== store('main..connection.secondary.status')) {
  //     ws.clients.forEach(socket => socket.close())
  //   }
  //   local = store('main..connection.local.status')
  //   secondary = store('main..connection.secondary.status')
  // })

  return server
}
