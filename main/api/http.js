// const http = require('http')
// const provider = require('../provider')
// const trusted = require('./trusted')
//
// const polls = {}
// const pollSubs = {}
//
// const cleanupTimers = {}
// const cleanup = id => {
//   delete polls[id]
//   let unsub = []
//   Object.keys(pollSubs).forEach(sub => {
//     if (pollSubs[sub] === id) {
//       delete pollSubs[sub]
//       unsub.push(sub)
//     }
//   })
//   if (unsub.length > 0) provider.unsubscribe(unsub, res => console.log('Provider Unsubscribe', res))
// }
//
// const handler = (req, res) => {
//   res.setHeader('Access-Control-Allow-Origin', '*')
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
//   if (req.method === 'OPTIONS') {
//     res.writeHead(200)
//     res.end()
//   } else if (req.method === 'POST' && trusted(req.headers.origin)) {
//     let body = []
//     req.on('data', chunk => body.push(chunk)).on('end', () => {
//       res.on('error', err => console.error('res err', err))
//       let payload = JSON.parse(Buffer.concat(body).toString())
//       if (payload.method === 'eth_pollSubscriptions') {
//         let id = payload.params[0]
//         if (typeof id === 'string') {
//           let result = polls[id] || []
//           res.writeHead(200, { 'Content-Type': 'application/json' })
//           res.end(JSON.stringify({ id: payload.id, jsonrpc: payload.jsonrpc, result }))
//           delete polls[id]
//           clearTimeout(cleanupTimers[id])
//           cleanupTimers[id] = setTimeout(cleanup.bind(null, id), 120 * 1000)
//           return
//         } else {
//           res.writeHead(401, { 'Content-Type': 'application/json' })
//           res.end(JSON.stringify({ error: 'Invalid Client ID' }))
//         }
//       }
//       provider.send(payload, response => {
//         if (response && response.result) {
//           if (payload.method === 'eth_subscribe') {
//             pollSubs[response.result] = payload.pollId
//           } else if (payload.method === 'eth_unsubscribe') {
//             payload.params.forEach(sub => { if (pollSubs[sub]) delete pollSubs[sub] })
//           }
//         }
//         res.writeHead(200, { 'Content-Type': 'application/json' })
//         res.end(JSON.stringify(response))
//       })
//     }).on('error', err => console.error('req err', err))
//   } else {
//     res.writeHead(401, { 'Content-Type': 'application/json' })
//     res.end(JSON.stringify({ error: 'Permission Denied' }))
//   }
// }
//
// // Track subscriptions
// provider.on('data', payload => {
//   if (pollSubs[payload.params.subscription]) {
//     let id = pollSubs[payload.params.subscription]
//     polls[id] = polls[id] || []
//     polls[id].push(JSON.stringify(payload))
//   }
// })

// module.exports = () => http.createServer()
