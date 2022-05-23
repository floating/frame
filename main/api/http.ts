import http, { IncomingMessage, ServerResponse } from 'http'
import log from 'electron-log'

import provider, { ProviderDataPayload } from '../provider'
import accounts from '../accounts'
import store from '../store'

import { updateOrigin, isTrusted } from './origins'
import validPayload from './validPayload'
import protectedMethods from './protectedMethods'

const logTraffic = process.env.LOG_TRAFFIC

interface PendingRequest {
  send: () => void,
  timer: NodeJS.Timeout
}

interface Subscription {
  id: string,
  origin: string
}

interface HTTPPollingPayload extends JSONRPCRequestPayload {
  pollId?: string
}

const polls: Record<string, string[]> = {}
const pollSubs: Record<string, Subscription> = {}
const pending: Record<string, PendingRequest> = {}
const cleanupTimers: Record<string, NodeJS.Timeout> = {}

const storeApi = {
  getPermissions: (address: Address) => {
    return store('main.permissions', address) as Record<string, Permission>
  }
}

const cleanup = (id: string) => {
  delete polls[id]
  delete pending[id]
  Object.keys(pollSubs).forEach(sub => {
    if (pollSubs[sub].id === id) {
      provider.send({ jsonrpc: '2.0', id: 1, method: 'eth_unsubscribe', params: [sub], _origin: '' })
      delete pollSubs[sub]
    }
  })
}

const handler = (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
  } else if (req.method === 'POST') {
    const body: any = []
    req.on('data', chunk => body.push(chunk)).on('end', async () => {
      res.on('error', err => console.error('res err', err))
      const data = Buffer.concat(body).toString()
      const rawPayload = validPayload<HTTPPollingPayload>(data)
      if (!rawPayload) return console.warn('Invalid Payload', data)

      const origin = req.headers.origin
      const payload = updateOrigin(rawPayload, origin)

      if (logTraffic) log.info(`req -> | http | ${req.headers.origin} | ${payload.method} | -> | ${JSON.stringify(payload.params)}`)
      if (protectedMethods.indexOf(payload.method) > -1 && !(await isTrusted(origin))) {
        let error = { message: `Permission denied, approve ${origin} in Frame to continue`, code: 4001 }
        // Review
        if (!accounts.getSelectedAddresses()[0]) error = { message: 'No Frame account selected', code: 4001 }
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ id: payload.id, jsonrpc: payload.jsonrpc, error }))
      } else {
        if (payload.method === 'eth_pollSubscriptions') {
          const id = payload.params[0]
          const send = (force: boolean) => {
            const result = polls[id] || []
            if (result.length || payload.params[1] === 'immediate' || force) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              const response = { id: payload.id, jsonrpc: payload.jsonrpc, result }
              if (logTraffic) log.info(`<- res | http | ${origin} | ${payload.method} | <- | ${JSON.stringify(response)}`)
              res.end(JSON.stringify(response))
              delete polls[id]
              clearTimeout(cleanupTimers[id])
              cleanupTimers[id] = setTimeout(cleanup.bind(null, id), 20 * 1000)
            } else {
              const sendResponse = () => {
                const pendingRequest = pending[id]
                if (pendingRequest && pendingRequest.timer) {
                  clearTimeout(pendingRequest.timer)
                }
              
                delete pending[id]

                send(true)
              }

              pending[id] = { 
                send: sendResponse,
                timer: setTimeout(sendResponse, 15 * 1000)
              }
            }
          }
          if (typeof id === 'string') return send(false)
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid Client ID' }))
        }

        provider.send(payload, response => {
          if (response && response.result) {
            if (payload.method === 'eth_subscribe') {
              pollSubs[response.result] = { id: rawPayload.pollId || '', origin: payload._origin } // Refactor this so you don't need to send a pollId and use the existing subscription id
            } else if (payload.method === 'eth_unsubscribe') {
              payload.params.forEach(sub => { if (pollSubs[sub]) delete pollSubs[sub] })
            }
          }

          if (logTraffic) log.info(`<- res | http | ${req.headers.origin} | ${payload.method} | <- | ${JSON.stringify(response)}`)
          res.writeHead(200, { 'Content-Type': 'application/json' })
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
provider.on('data', (payload: ProviderDataPayload) => {
  if (pollSubs[payload.params.subscription]) {
    const { id, origin } = pollSubs[payload.params.subscription]
    polls[id] = polls[id] || []

    if (!payload.params.origin || payload.params.origin === origin) {
      const { origin, ...params } = payload.params
      const responsePayload = { ...payload, params }

      polls[id].push(JSON.stringify(responsePayload))

      pending[id]?.send()
    }
  }
})

provider.on('data:address', (account, payload) => { // Make sure the subscription has access based on current account
  if (pollSubs[payload.params.subscription]) {
    const { id, origin } = pollSubs[payload.params.subscription]
    const permissions = storeApi.getPermissions(account) || {}
    const permission = Object.values(permissions).find(p => p.origin === origin) || { provider: false }

    if (!permission.provider) payload.params.result = []
    polls[id] = polls[id] || []
    polls[id].push(JSON.stringify(payload))
    if (pending[id]) pending[id].send()
  }
})

export default function () {
  return http.createServer(handler)
}
