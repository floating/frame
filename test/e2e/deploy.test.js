const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:1248'))

test('Deploy Contract', (done) => {
  web3.eth
    .getAccounts()
    .then((accounts) => {
      web3.eth
        .sendTransaction({
          from: accounts[0],
          data: '0x6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820f50314badc96cf2df848b358f976e52facd1986d2f3eb5bd7b41071ac667ae480029',
          gas: '0x10cba',
        })
        .on('transactionHash', (hash) => {
          expect(hash).toBeTruthy()
          done()
        })
    })
    .catch((err) => {
      console.log(err)
    })
})
