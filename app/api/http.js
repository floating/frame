import http from 'http'
import provider from '../provider'
import trusted from './trusted'

const polls = {}
const pollSubs = {}

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'POST' && trusted(req.headers.origin)) {
    let body = []
    req.on('data', chunk => body.push(chunk)).on('end', () => {
      res.on('error', err => console.error('res err', err))
      let payload = JSON.parse(Buffer.concat(body).toString())
      if (payload.method === 'eth_pollSubscriptions') {
        let id = payload.params[0]
        if (typeof id === 'string') {
          let result = polls[id] || []
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({id: payload.id, jsonrpc: payload.jsonrpc, result}))
          polls[id] = []
          return
        } else {
          res.writeHead(401, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({error: 'Invalid Client ID'}))
        }
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

// Track subscriptions
provider.on('data', payload => {
  if (pollSubs[payload.params.subscription]) {
    let id = pollSubs[payload.params.subscription]
    polls[id] = polls[id] || []
    polls[id].push(JSON.stringify(payload))
  }
})

export default () => http.createServer(handler)
