/* globals WebSocket */

const Web3 = require('web3')
const EventEmitter = require('events')

const connect = (provider, url = 'ws://localhost:1248', reconnect = true) => {
  provider.reqCalllbacks = {}
  if (!provider.socket || provider.socket.readyState > 1) {
    provider.socket = new WebSocket(url)
    provider.socket.addEventListener('open', () => {
      console.log('Frame Provider Connected!')
      provider.emit('open')
    })
    provider.socket.addEventListener('close', () => {
      console.log('Frame Provider Disconnected!')
      provider.socket = null
      if (reconnect) setTimeout(_ => connect(provider, url), 1000)
      provider.emit('close')
    })
    provider.socket.addEventListener('message', message => {
      try { message = JSON.parse(message.data) } catch (e) { return console.warn(e) }
      if (!message.id && message.method && message.method.indexOf('_subscription') !== -1) {
        provider.emit('data', message)
      } else if (message.id) {
        if (provider.reqCalllbacks[message.id]) {
          provider.reqCalllbacks[message.id](message.error, message)
        } else {
          console.warn('No request callback for socket message in provider: ', message)
        }
      } else {
        console.warn('Unrecognized socket message in provider: ', message)
      }
    })
  }
}

const getProvider = url => {
  const provider = new EventEmitter()
  connect(provider, url)
  provider.send = (payload, cb) => {
    if (provider.socket && provider.socket.readyState === provider.socket.CONNECTING) {
      setTimeout(_ => provider.send(payload, cb), 10)
    } else if (!provider.socket || provider.socket.readyState > 1) {
      cb(new Error('Provider Disconnected'))
    } else {
      provider.reqCalllbacks[payload.id] = cb
      provider.socket.send(JSON.stringify(payload))
    }
  }
  provider.sendAsync = provider.send
  return provider
}

let active = JSON.parse(localStorage.getItem('__frameActive'))

if (active) {
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
}
