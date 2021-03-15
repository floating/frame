const WebSocket = require('ws')
const { v4: uuid } = require('uuid')
const log = require('electron-log')
const qs = require('querystring')
const crypto = require('crypto')

const storage = require('../storage')
const sessions = require('../sessions')
const resolve = require('../resolve')

const connections = {}

const ens = url => {
  let name = url
  name = name.indexOf('://') > -1 ? name.split('://')[1] : name
  name = name.indexOf(':') > -1 ? name.split(':')[0] : name
  name = name.indexOf('?') > -1 ? name.split('?')[0] : name
  name = name.indexOf('/') > -1 ? name.split('/')[0] : name
  return name
}

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', (s, req) => {
    // console.log('connection', req.headers.origin)
    if (req.headers.origin.indexOf('extension://') > -1) {
      // const ext = req.headers.origin
      // const session = crypto.randomBytes(6).toString('hex')
      s.on('message', (data, cb) => {
        try {
          console.log('hi here')
          const message = JSON.parse(data)
          const app = ens(message.app)
          const session = crypto.randomBytes(6).toString('hex')
          sessions.add(app, session)
          console.log('responding with', JSON.stringify({ id: message.id, app, session }))
          if (s.readyState !== WebSocket.OPEN) throw new Error('Socket Not Open')
          s.send(JSON.stringify({ id: message.id, app, session }))
        } catch (e) {
          console.error(e)
        }
      })
      s.on('error', err => log.error('Dapp Socket Error', err))
      s.on('close', _ => {
        log.error('EXTENSION CLOSES Socket')
        // sessions.remove(app, session)
        // connections[app].splice(connections[app].indexOf(session), 1)
        // if (connections[app].length === 0) delete connections[app]
      })
      console.log('We have an extensions connection to the dapp socket')
      // give socket ability to create dapp sessions
      // check for app server
    } else {
      const { app, session } = qs.parse(req.url.split('?')[1])
      const hash = resolve.cid(app)
      if (sessions.verify(app, session) && req.headers.origin === 'http://localhost:8421') {
        s.id = uuid()
        connections[app] = connections[app] || []
        connections[app].push(s)
        s.on('message', data => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'localStorage') storage.update(hash, message.state)
            connections[app].forEach(i => { if (i.id !== s.id) s.send(data) })
          } catch (e) {}
        })
        s.on('error', err => log.error('Dapp Socket Error', err))
        s.on('close', _ => {
          sessions.remove(app, session)
          connections[app].splice(connections[app].indexOf(session), 1)
          if (connections[app].length === 0) delete connections[app]
        })
      }
    }
  })
  return server
}
