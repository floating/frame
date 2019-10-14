const WebSocket = require('ws')
const uuid = require('uuid/v4')
const log = require('electron-log')
const qs = require('querystring')

const storage = require('../storage')
const sessions = require('../sessions')

const connections = {}

module.exports = server => {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', (s, req) => {
    const { hash, session } = qs.parse(req.url.split('?')[1])
    if (sessions.verify(hash, session) && req.headers.origin === 'http://localhost:8421') {
      s.id = uuid()
      connections[hash] = connections[hash] || []
      connections[hash].push(s)
      s.on('message', data => {
        try {
          const message = JSON.parse(data)
          if (message.type === 'localStorage') storage.update(hash, message.state)
          connections[hash].forEach(i => { if (i.id !== s.id) s.send(data) })
        } catch (e) {}
      })
      s.on('error', err => log.error('Dapp Socket Error', err))
      s.on('close', _ => {
        sessions.remove(hash, session)
        connections[hash].splice(connections[hash].indexOf(session), 1)
        if (connections[hash].length === 0) delete connections[hash]
      })
    }
  })
  return server
}
