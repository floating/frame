const WebSocket = require('ws')
const uuid = require('uuid/v4')
const log = require('electron-log')
const qs = require('querystring')

const storage = require('../storage')
const sessions = require('../sessions')
const resolve = require('../resolve')

const connections = {}

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', (s, req) => {
    const { app, session } = qs.parse(req.url.split('?')[1])
    const hash = resolve.hash(app)
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
  })
  return server
}
