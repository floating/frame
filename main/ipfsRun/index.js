const ipfs = require('ipfs-core')
const peers = require('./peers.json')

const store = require('../store').default

// const peers = require('./peers.json')
const ens = require('../ens')

let node

const api = {
  // pin: async path => {
  //   await node.pin.add(path)
  //   console.log(`${path} has been pinned!`)
  // },
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
  get: async (path) => {
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
  getFile: async (path) => {
    const files = await api.get(path)
    if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
    if (files[0].path !== path || files.length !== 1) throw new Error(`Path ${path} could not be found`)
    return files[0]
  },
}

const start = async () => {
  try {
    node = await ipfs.create()
    const connectPeers = async () => {
      // const peers = await ens.resolvePeers('frame-internal')
      for (const peer of peers) {
        await node.swarm.connect(peer)
      }
    }
    await connectPeers()
    const id = await node.id()
  } catch (e) {
    // destryo ipfs instance...

    console.error(e)
    // ipfs.destroy()
    setTimeout(() => start(), 15 * 1000)
    return
  }

  // const connectPeers = async () => {
  //   // const peers = await ens.resolvePeers('frame-internal')
  //   for (const peer of peers) await node.swarm.connect(peer)
  // }
  // await connectPeers()
  // store.setIPFS(update)
  // store.setClientState('ipfs', 'ready')
}

start()

module.exports = api
