const http = require('http')
const log = require('electron-log')
const provider = require('../provider')
const trusted = require('./trusted')
const signers = require('../signers')
const store = require('../store')

const polls = {}
const pollSubs = {}

const cleanupTimers = {}
const cleanup = id => {
  delete polls[id]
  let unsub = []
  Object.keys(pollSubs).forEach(sub => {
    if (pollSubs[sub] === id) {
      delete pollSubs[sub]
      unsub.push(sub)
    }
  })
  // TODO: if (unsub.length > 0) provider.unsubscribe(unsub, res => console.log('Provider Unsubscribe', res))
}

let flushTimer
let pending = []
let flush = () => {
  clearTimeout(flushTimer)
  flushTimer = false
  pending.forEach(send => send(true))
  pending = []
}

const protectedMethods = ['eth_coinbase', 'eth_accounts', 'eth_sendTransaction', 'personal_sign', 'personal_ecRecover', 'eth_sign']

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
  } else if (req.method === 'POST') {
    let body = []
    req.on('data', chunk => body.push(chunk)).on('end', () => {
      res.on('error', err => console.error('res err', err))
      let origin = req.headers.origin || 'Unknown'
      let payload = JSON.parse(Buffer.concat(body).toString())

      log.info('| req -> | http | ' + req.headers.origin + ' >>> ' + payload.method + ' --- ' + (payload.params || '[]'))
      if (protectedMethods.indexOf(payload.method) > -1 && !trusted(origin)) {
        let error = { message: 'Permission denied, approve ' + origin + ' in Frame to continue', code: -1 }
        if (!signers.getSelectedAccounts()[0]) error = { message: 'No Frame account selected', code: -1 }
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ id: payload.id, jsonrpc: payload.jsonrpc, error }))
      } else {
        if (payload.method === 'eth_pollSubscriptions') {
          let id = payload.params[0]
          let send = force => {
            let result = polls[id] || []
            if (result.length || payload.params[1] === 'immediate' || force) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              let response = { id: payload.id, jsonrpc: payload.jsonrpc, result }
              log.info('| <- res | http | ' + origin + ' <<< ' + payload.method + ' --- ' + (response.result || response.error))
              res.end(JSON.stringify(response))
              delete polls[id]
              clearTimeout(cleanupTimers[id])
              cleanupTimers[id] = setTimeout(cleanup.bind(null, id), 120 * 1000)
            } else {
              pending.push(send)
              if (!flushTimer) flushTimer = setTimeout(flush, 15000)
            }
          }
          if (typeof id === 'string') return send()
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid Client ID' }))
        }
        provider.send(payload, response => {
          if (response && response.result) {
            if (payload.method === 'eth_subscribe') {
              pollSubs[response.result] = { id: payload.pollId, origin } // Refactor this so you don't need to send a pollId and use the existing subscription id
            } else if (payload.method === 'eth_unsubscribe') {
              payload.params.forEach(sub => { if (pollSubs[sub]) delete pollSubs[sub] })
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          log.info('| <- res | http | ' + req.headers.origin + ' <<< ' + payload.method + ' --- ' + (response.result || response.error))
          res.end(JSON.stringify(response))
        })
      }
    }).on('error', err => console.error('req err', err))
  } else {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Permission Denied' }))
  }
}

// Track subscriptions
provider.on('data', payload => {
  if (pollSubs[payload.params.subscription]) {
    let { id } = pollSubs[payload.params.subscription]
    polls[id] = polls[id] || []
    polls[id].push(JSON.stringify(payload))
    flush()
  }
})

provider.on('data:accounts', (account, payload) => { // Make sure the subscription has access based on current account
  if (pollSubs[payload.params.subscription]) {
    let { id, origin } = pollSubs[payload.params.subscription]
    let permissions = store('main.accounts', account, 'permissions') || {}
    let perms = Object.keys(permissions).map(id => permissions[id])
    let allowed = perms.map(p => p.origin).indexOf(origin) > -1
    if (!allowed) payload.params.result = []
    polls[id] = polls[id] || []
    polls[id].push(JSON.stringify(payload))
    flush()
  }
})

module.exports = () => http.createServer(handler)
