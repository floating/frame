let Web3 = require('web3')

try {
  var provider = new Web3.providers.WebsocketProvider('ws://localhost:1248')
  provider.connection.onopen = function () {
    window.web3 = new Web3(provider)
    console.log('Frame Provider Connected!')
  }
  provider.connection.onclose = function () {
    console.log('Frame Provider Disconnected!')
  }
} catch (e) {
  console.error('Frame Error:', e)
}
