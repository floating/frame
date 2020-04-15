const ipfs = require('ipfs')

const start = async () => {
  try {
    const node = await ipfs.create()
    const id = await node.id()
    console.log('ipfs.js created')
    console.log(id)
  } catch (e) {
    console.error(err)
    setTimeout(() => start(), 10 * 1000) 
  }
}

start()
