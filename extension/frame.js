/* globals WebSocket */

const Web3 = require('web3')
const EventEmitter = require('events')
const uuid = require('uuid/v4')

const connect = (provider, url = 'ws://localhost:1248', reconnect = true, quiet = false) => {
  window.frame = window.frame || {initialConnect: true, provider}
  if (window.frame.initialConnect) {
    window.frame.initialConnect = false
    quiet = true
    reconnect = false
  }
  provider.handlers = {}
  if (!provider.socket || provider.socket.readyState > 1) {
    provider.socket = new WebSocket(quiet ? 'ws://localhost:1248/?mode=quiet' : 'ws://localhost:1248')
    provider.socket.addEventListener('open', () => {
      console.log('Frame Provider Connected!')
      if (!quiet) window.location.reload()
      reconnect = true
      provider.emit('open')
    })
    provider.socket.addEventListener('close', () => {
      console.log('Frame Provider Disconnected!')
      provider.socket = null
      if (reconnect) setTimeout(_ => connect(provider, url), 1000)
      provider.emit('close')
    })
    provider.socket.addEventListener('message', message => {
      message = JSON.parse(message.data)
      if (message.type === 'response' && provider.handlers[message.handlerId]) {
        provider.handlers[message.handlerId](message.err, message.res)
      } else if (message.type === 'subscription') {
        provider.emit('data', message.payload)
      } else {
        console.log('No handler for socket message in provider: ', message)
      }
    })
  }
}

const getProvider = (url) => {
  const provider = new EventEmitter()
  connect(provider, url)
  provider.send = (payload, cb) => {
    if (provider.socket && provider.socket.readyState === provider.socket.CONNECTING) {
      setTimeout(_ => provider.send(payload, cb), 10)
    } else if (!provider.socket || provider.socket.readyState > 1) {
      cb(new Error('Provider Disconnected'))
    } else {
      payload.handlerId = uuid()
      provider.handlers[payload.handlerId] = cb
      provider.socket.send(JSON.stringify(payload))
    }
  }
  return provider
}

try {
  let provider = getProvider()
  window.web3 = new Web3(provider)
  provider.socket.addEventListener('open', () => {
    window.web3.eth.getAccounts((err, accounts) => {
      if (err) console.log(err)
      window.web3.eth.accounts = accounts
      window.web3.eth.coinbase = accounts[0]
    })
  })
} catch (e) {
  console.error('Frame Error:', e)
}
