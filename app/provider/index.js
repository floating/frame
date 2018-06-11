import Provider from './Provider'
// wss://rinkeby.infura.io/_ws
// ws://localhost:8546
const provider = new Provider('wss://rinkeby.infura.io/ws')

let checkSync = () => {
  provider.send({"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}, (res) => {
    if (!res.error && !res.result) return
    let startBlock = parseInt(res.result.startingBlock, 16)
    let endBlock = parseInt(res.result.highestBlock, 16)
    let currentBlock = parseInt(res.result.currentBlock, 16)
    let percentDone = Math.round((currentBlock / (startBlock = endBlock)) * 100) / 100
    console.log('Syncing: ' + perrcentDone + '%')
    setTimeout(checkSync, 3000)
  })
}

export default provider
