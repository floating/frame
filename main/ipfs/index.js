const IpfsHttpClient = require('ipfs-http-client')
const peers = require('./peers.json')


const { globSource } = IpfsHttpClient
// const ipfs = IpfsHttpClient()


// if there is an ipfs endpoint in the store use that otherwise use pylon
let node

const connect = async () => {
  try {
    node = IpfsHttpClient({ port: 5002 })
    // const connectPeers = async () => {
    //   // const peers = await ens.resolvePeers('frame.eth')
    //   for (const peer of peers) {
    //     await node.swarm.connect(peer)
    //   }
    // }
    // await connectPeers()
    // const id = await node.id()
    // console.log(id)
  } catch (e) {
    // destryo ipfs instance...

    node = null

    console.error(e)
    // ipfs.destroy()
    setTimeout(() => connect(), 15 * 1000)
    return
  }

  console.log('~~~~~~~~~~~')
  console.log('')
  console.log('IPFS is READY')
  console.log('')
  console.log('~~~~~~~~~~~')

  // const connectPeers = async () => {
  //   // const peers = await ens.resolvePeers('frame.eth')
  //   for (const peer of peers) await node.swarm.connect(peer)
  // }
  // await connectPeers()
  // store.setIPFS(update)
  // store.setClientState('ipfs', 'ready')
}

connect()


// const surface = {
//   getStream: async path => {
//     // if (!node) throw new Error(`IPFS is not running`)
//     // console.log(node)
//     // return node.getReadableStream(path)

//     if (!node) throw new Error(`IPFS is not running`)
//     const files = []
//     for await (const file of node.get(path)) {
//       if (!file.content) continue
//       let content = Buffer.from('')
//       console.log(file.path)
//       for await (const data of file.content) {
//         content = Buffer.concat([content, Buffer.from(data)])
//       }
//       file.content = content
//       console.log('  ->  Done')
//       files.push(file)
//     }
//     return files

//   },
//   get: async path => {
//     if (!node) throw new Error('IPFS is not running')
//     const files = []
//     for await (const file of node.get(path)) {
//       if (!file || !file.content) continue
//       let content = Buffer.from('')
//       for await (const data of file.content) {
//         content = Buffer.concat([content, Buffer.from(data)])
//       }
//       file.content = content
//       files.push(file)
//     }
//     return files
//   },
//   getFile: async path => {
//     if (!node) throw new Error(`IPFS is not running`)
//     console.log('ipfs getFile', path)
//     const files = await surface.get(path)
//     if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
//     if (files[0].path !== path || files.length !== 1) throw new Error(`Path ${path} could not be found`)
//     return files[0]
//   }
// }

const surface = {
  get: async path => {
    if (!node) throw new Error('IPFS is not running')
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
    console.log('ipfs getFile 0', path)
    const files = await surface.get(path)
    if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
    if (files[0].path !== path || files.length !== 1) throw new Error(`Path ${path} could not be found`)
    return files[0]
  },
  pin: async (cid) => {
    // console.log('Pinning', cid)
    if (!node) throw new Error('IPFS is not running')
    const result = await node.pin.add(cid)
    return result
  }
}
module.exports = surface
