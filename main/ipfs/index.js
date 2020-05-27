const ipfs = require('ipfs')

const store = require('../store')

// const peers = require('./peers.json')
const ens = require('../ens')

let node 

const api = {
  pin: async path => {
    const pinset = await node.pin.add(path)
    console.log(`${path} has been pinned!`)
  }, 
  // getStream: async path => {
  //   // if (!node) throw new Error(`IPFS is not running`)
  //   // console.log(node)
  //   // return node.getReadableStream(path)



  //   if (!node) throw new Error(`IPFS is not running`)
  //   const files = []
  //   for await (const file of node.get(path)) {
  //     if (!file.content) continue
  //     let content = Buffer.from('')
  //     console.log(file.path)
  //     for await (const data of file.content) {
  //       content = Buffer.concat([content, Buffer.from(data)])
  //     }
  //     file.content = content
  //     console.log('  ->  Done')
  //     files.push(file)
  //   }
  //   return files

  // },
  get: async path => {
    if (!node) throw new Error(`IPFS is not running`)
    const files = []
    for await (const file of node.get(path)) {
      if (!file || !file.content) continue
      let content = Buffer.from('')
      for await (const data of file.content) {
        content = Buffer.concat([content, Buffer.from(data)])
      }
      file.content = content
      files.push(file)
    }
    return files
  },
  getFile: async path => {
    const files = await api.get(path)
    if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
    if (files[0].path !== path || files.length !== 1) throw new Error(`Path ${path} could not be found`)
    return files[0] 
  }
}

const start = async () => {

  try {
    node = await ipfs.create()
    console.log('IPFS Node Created')
  } catch (e) {
    console.error(e) 
    setTimeout(() => start(), 15 * 1000) 
    return
  }

  console.log('IPFS carrying on...')

  const connectPeers = async () => {
    const peers = await ens.resolvePeers('frame.eth')
    for (const peer of peers) await node.swarm.connect(peer)
  }

  console.log('IPFS Node Ready')

  await connectPeers()

  console.log('IPFS Peers connected!')

  console.log('Getting IPFS peer ID')

  const id = await node.id()

  // console.log('Updating IPFS stare in store')
  const update = JSON.parse(JSON.stringify(id))
  store.setIPFS(update)

  store.setClientState('ipfs', 'ready')

}

start()

module.exports = api