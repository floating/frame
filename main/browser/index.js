// NPM modules
const { BrowserWindow } = require('electron')
const PersistStore = require('electron-store')

// Frame modules
const ipfs = require('../services/ipfs')
const ens = require('../ens')
const store = require('../store')

// TODO: Move to better place
ipfs.start()

const persist = new PersistStore()
store.observer(_ => persist.set('browser', store('browser')))

let win = null

/* PUBLIC */
exports.launchBrowser = async (address) => {
  // Parse address
  const url = await parseAddress(address)
  // If valid address -> Launch URL in browser
  if (url) {
    // If no browser window open -> open new window
    if (!win) {
      // Open window with stored/default bounds
      const bounds = store('browser.bounds')
      win = new BrowserWindow({ ...bounds })
      // On close -> store bounds
      win.on('close', () => { store.setBrowserBounds(win.getBounds()) })
      // On closed -> delete instance
      win.on('closed', () => { win = null })
    }
    // Load URL
    win.loadURL(url)
  }
}

/* PRIVATE */
const parseAddress = async (address) => {
  // Handle ENS address
  if (address.match(/.eth$/i)) {
    // Resolve ENS name
    const contentLink = await ens.resolveContent(address)
    // Remove protocol prefix ('ipfs://')
    const hash = contentLink.slice(7)
    // Construct and return IPFS URL
    return constructIpfsURL(hash)
  }

  // Handle raw IPFS hash
  if (validateIpfsHash(address)) {
    return constructIpfsURL(address)
  }

  // Handle IPFS hash with protocol
  if (address.match(/^ipfs:\/\//i)) {
    const hash = address.slice(7)
    if (validateIpfsHash(hash)) {
      return constructIpfsURL(hash)
    }
  }

  return null
}

const constructIpfsURL = (hash) => `http://localhost:8421/ipfs/${hash}`

const validateIpfsHash = (hash) => hash.slice(0, 2) === 'Qm' && hash.length === 46

// DEBUG
// setTimeout(async () => {
//   const address = parseAddress('monkybrain.eth')
//   console.log(address)
// }, 1000)
