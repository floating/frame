const { app } = require('electron')
const path = require('path')
const log = require('electron-log')
const ipfsHttpClient = require('ipfs-http-client')

const Client = require('../Client')
const { userData } = require('../../util')
const peers = require('./peers.json')

// Mock windows module if running tests
const windows = app ? require('../../windows') : { broadcast: () => {} }

class IPFS extends Client {
  constructor (options) {
    super('ipfs', options)

    console.log(userData)

    process.env.IPFS_PATH = path.resolve(userData, 'ipfs-repo')

    // On 'service ready' -> start ipfs
    this.on('ready', async () => {
      // Run 'ipfs init'
      await this.init()

    })

    // Handle stdout
    this.on('stdout', async (stdout) => {
      console.log('IPFS PROCESS:', stdout)
      // On 'daemon ready' -> client state 'ready'
      if (stdout.match(/Daemon is ready\n$/i)) {
        // Add Frame peers
        try {
          await Promise.all(peers.map((peer) => this.runOnce(['swarm', 'connect', peer])))
        } catch (err) {
          log.error('Failed to connect to Frame IPFS peers', err)
        }

        // Setup HTTP client
        // console.log('Setup HTTP Xlietn', await this.getConfig('Addresses.API'))
        this.api = ipfsHttpClient(await this.getConfig('Addresses.API'))

        // TODO: Remove logging of active peers below
        // const activePeers = await this.runOnce(['swarm', 'peers'])
        // log.info('ipfs: active peers', activePeers)

        // Set state to 'ready'
        log.info('ipfs: ready')
        this.emit('state', 'ready')

        // const id = await this.runOnce(['id'])
      //   log.info('ipfs: id', id)
      }
      // On 'repo migration required' -> run migration
      if (stdout.match(/Run migrations now/i)) {
        log.info('ipfs: client asking to run repo migration')
        this.process.stdin.write('y\n')
      }
    })
    // this.restart()
  }

  start () {
    super.start()
    // Run 'ipfs daemon'
    this.run(['daemon', '--enable-pubsub-experiment'], async (err) => {
      if (err.message.includes('ipfs daemon is running')) {
        // windows.broadcast('main:action', 'notify', 'ipfsAlreadyRunning')
        this.emit('state', 'off')
        await this.runOnce(['shutdown'])
        this.setTimeout(() => {
          this.start()
        }, 5000)
      } else if (err.message.includes('Received interrupt signal')) {
        console.log('IPFS Force Quit...')
        this.emit('state', 'off')
      } else if (err.message.includes('Received another interrupt before graceful shutdown')) {
        console.log('IPFS Force Quit...')
        this.emit('state', 'off')
      } else if (err) {
        // Stop client
        // TODO: Better errer descriptions
        this.emit('state', err.message)
      }
    })
  }

  // Routing.Type to "dhtclient"
  // Reprovider.Interval to "0"
  // Swarm.ConnMgr.LowWater to 20
  // Swarm.ConnMgr.HighWater to 40
  // Swarm.ConnMgr.GracePeriod to 1

  async printPowerSettings () {
    console.log('Routing.Type', await this.getConfig('Routing.Type'))
    console.log('Reprovider.Interval', await this.getConfig('Reprovider.Interval'))
    console.log('Swarm.ConnMgr.LowWater', await this.getConfig('Swarm.ConnMgr.LowWater'))
    console.log('Swarm.ConnMgr.HighWater', await this.getConfig('Swarm.ConnMgr.HighWater'))
    console.log('Swarm.ConnMgr.GracePeriod', await this.getConfig('Swarm.ConnMgr.GracePeriod'))
  }

  // Routing.Type dht
  // Reprovider.Interval 12h
  // Swarm.ConnMgr.LowWater 600
  // Swarm.ConnMgr.HighWater 900
  // Swarm.ConnMgr.GracePeriod 20s

  async setNormalPower () {
    await this.setConfig('Routing.Type', 'dht')
    await this.setConfig('Reprovider.Interval', '12h')
    await this.setConfig('Swarm.ConnMgr.LowWater', 600)
    await this.setConfig('Swarm.ConnMgr.HighWater', 900)
    await this.setConfig('Swarm.ConnMgr.GracePeriod', '20s')
  }

  // Routing.Type dhtclient
  // Reprovider.Interval 24
  // Swarm.ConnMgr.LowWater 20
  // Swarm.ConnMgr.HighWater 40
  // Swarm.ConnMgr.GracePeriod 1s

  async setLowPower () {
    await this.runOnce(['config', 'profile', 'apply', 'lowpower'])
    // await this.setConfig('Routing.Type', 'dhtclient')
    // await this.setConfig('Reprovider.Interval', '0')
    // await this.setConfig('Swarm.ConnMgr.LowWater', 20)
    // await this.setConfig('Swarm.ConnMgr.HighWater', 40)
    // await this.setConfig('Swarm.ConnMgr.GracePeriod', '1s')
  }

  async init () {
    try {
      await this.runOnce(['init', '--profile=lowpower'])
      log.info('ipfs init successful')
    } catch (err) {
      log.error(err)
      log.info('ipfs: repo already initiated')
    }
  }

  async getConfig (key) {
    const config = key ? await this.runOnce(['config', key]) : await this.runOnce(['config', 'show'])
    try {
      config.trim()
      return JSON.parse(config)
    } catch (err) {
      return config
    }
  }

  async setConfig (key, value) {
    await this.runOnce(['config', '--json', key, JSON.stringify(value)])
  }

  async isRunning () {
    try {
      await this.runOnce(['diag', 'cmds'])
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = new IPFS()
