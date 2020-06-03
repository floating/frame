const ipfs = require('ipfs')

const store = require('../store')

// const peers = require('./peers.json')
const ens = require('../ens')

const OrbitDB = require('orbit-db')

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

// var fs = require('fs');


// let seen = require('./seen.json')


// const notify = n => {
//   if (seen.map(n => n.time).indexOf(n.time) > -1) return
//   seen.unshift(n)
//   if (seen.length > 32) seen = seen.slice(0, 32)
//   // fs.writeFile('./seen.json', seen, (err) {
//   //   if (err) console.log(err)
//   // })
//   console.log('New notification!')
//   console.log(n)
// }

// const connectNotifications = async () => {
//   // const address = await ens.resolvePeers('frame.eth')
//   const orbitdb = await OrbitDB.createInstance(node)
//   const db = await orbitdb.feed('/orbitdb/zdpuAyP1FDwU5wyQ1tkhxhq7TNCSiFihE6cSKtKS2t9tHawNC/notifications')
//   await db.load(32)

//   let getTimer, running
  
//   const getNotifications = async ()=> {
//     const notifications = await db.iterator({ limit: 32, reverse: true }).collect().map(e => e.payload.value)
//     notifications.forEach(n => notify(n))
//   }
//   getNotifications()
//   db.events.on('replicated', getNotifications)
// }


let noteHeight = 0
let pendingNotes = []

// const addNote = (note) => {
//   notes.unshift(note)
  
//   console.log('new note', note)
// }

const sortedIndex = (array, value) => {
	var low = 0, high = array.length
	while (low < high) {
    let mid = low + high >>> 1
		if (array[mid] < value) low = mid + 1
		else high = mid
	}
	return low
}

let updateTimer
const announceUpdate = () => {
  console.log('UPDATES TO NOTES')
  console.log(pendingNotes)
}

const updateNoteHeight = height => {
  if (height <= noteHeight) return
  noteHeight = height
  let sliceIndex = pendingNotes.map(n => n.id).indexOf(noteHeight)
  pendingNotes = pendingNotes.slice(sliceIndex, pendingNotes.length - 1)
  console.log('noteHeight update:', noteHeight)
}

const submitNote = async note => {
  if (!note) return
  if (note.id <= noteHeight) return
  const index = sortedIndex(pendingNotes.map(n => n.id), note.id)
  if (pendingNotes[index] && pendingNotes[index].id === note.id) return // We're inserting before same id
  pendingNotes.splice(index, 0, note)
  announceUpdate()
  setTimeout(() => {
    updateNoteHeight(note.id)
  }, 10 * 1000)
}

let fetchTimeout

const connectNotifications = async () => {
  // const address = await ens.resolvePeers('frame.eth')
  const orbitdb = await OrbitDB.createInstance(node)
  const db = await orbitdb.keyvalue('/orbitdb/zdpuB2fQQdxECgPxPTr1EM4yz39oCrWvWq8puEJGuxRRsRB8y/neubla')
  await db.load()
  const getNotifications = async () => {
    clearTimeout(fetchTimeout)
    fetchTimeout = setTimeout(async () => {
      try {
        let notes = await db.get('notifications')
        if (notes && Array.isArray(notes)) {
          if (notes.length > 32) notes = notes.slice(0, 32)
          notes.forEach(submitNote)
        }
      } catch (e) {
        console.error('ERROR GETTING NOTIFICATIONS', e)
      }
    }, 1000)
  }
  getNotifications()
  db.events.on('replicated', getNotifications)
}

const start = async () => {
  try {
    node = await ipfs.create({
      EXPERIMENTAL: {
        pubsub: true
      }
    })
    console.log('IPFS Node Created')
  } catch (e) {
    console.error(e) 
    setTimeout(() => start(), 15 * 1000) 
    return
  }

  console.log('IPFS carrying on...')

  const connectPeers = async () => {
    // const peers = await ens.resolvePeers('frame.eth')
    const peers = ['/ip4/134.122.6.89/tcp/4001/ipfs/QmdZBuhwZZygi1i2ukZnpcZ1sFtHT7Da3mCcbrjF2xHAg6']
    console.log('connecting peers', peers)
    try{
      for (const peer of peers) await node.swarm.connect(peer)
    } catch (e) {
      console.log('Could not connect peer - ' + e.message)
    }
    
  }

  console.log('IPFS Node Ready')

  console.log('Connection Peers')

  await connectPeers()

  console.log('IPFS Peers connected!')

  console.log('Connection orbits')

  connectNotifications()

  console.log('Getting IPFS peer ID')

  const id = await node.id()

  // console.log('Updating IPFS stare in store')
  const update = JSON.parse(JSON.stringify(id))
  store.setIPFS(update)

  store.setClientState('ipfs', 'ready')

}

start()

module.exports = api