/* globals test expect */

const Web3 = require('web3')

let web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:1248'))

test('Deploy Contract', done => {
  web3.eth.sendTransaction({
    from: '0x0559fB375De2281b3C32020d26cc976c53527484',
    data: '0x6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820f50314badc96cf2df848b358f976e52facd1986d2f3eb5bd7b41071ac667ae480029',
    gas: '0x10cba'
  }).on('transactionHash', hash => {
    expect(hash).toBeTruthy()
    done()
  })
})

test('Send Transaction', done => {
  web3.eth.sendTransaction({
    value: Web3.utils.toHex(Math.round(1000000000000000 * Math.random())),
    to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
    from: '0x0559fB375De2281b3C32020d26cc976c53527484'
  }).on('transactionHash', hash => {
    expect(hash).toBeTruthy()
    done()
  })
})
