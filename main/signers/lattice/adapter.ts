import log from 'electron-log'

import { SignerAdapter } from '../adapters'
import store from '../../store'
import Lattice, { Status } from './Lattice'

interface LatticeSettings {
  deviceName: string,
  baseUrl: string,
  privateKey: string
}

function getLatticeSettings (deviceId: string): LatticeSettings {
  // Lattice supports a name with a max of 24 characters
  const suffix = store('main.latticeSettings.suffix')
  const deviceName = suffix ? `Frame-${suffix.substring(0, 18)}` : 'Frame'

  const endpointMode = store('main.latticeSettings.endpointMode')
  const baseUrl = (endpointMode === 'custom')
    ? store('main.latticeSettings.endpointCustom')
    : 'https://signing.gridpl.us'
  
  const privateKey = store('main.lattice', deviceId, 'privKey')

  return { deviceName, baseUrl, privateKey }
}

export default class LatticeAdapter extends SignerAdapter {
  private knownSigners: { [deviceId: string]: Lattice };

  private signerObserver: any;
  private settingsObserver: any;

  constructor () {
    super('lattice')

    this.knownSigners = {}
  }

  open () {
    this.settingsObserver = store.observer(() => {
      Object.values(this.knownSigners).forEach(lattice => {
        if (!lattice.connection) return
        
        const { deviceName, baseUrl, privateKey } = getLatticeSettings(lattice.deviceId)
        
        // if any connection settings have changed, re-connect
        if (
          deviceName !== lattice.connection.name ||
          baseUrl !== lattice.connection.baseUrl ||
          privateKey !== lattice.connection.privKey
        ) {
          lattice.disconnect()
          lattice.connect(deviceName, baseUrl, privateKey)
        }
      })

      const accountLimit = store('main.latticeSettings.accountLimit')
    })

    this.signerObserver = store.observer(() => {
      const lattice = store('main.lattice') || {}

      console.log({ lattice })

      Object.keys(lattice).forEach(deviceId => {
        if (!deviceId || (deviceId in this.knownSigners)) return

        log.debug('Connecting to Lattice device', { deviceId })

        const lattice = new Lattice(deviceId)
        const emitUpdate = () => this.emit('update', lattice)

        lattice.on('update', emitUpdate)

        lattice.on('connect', paired => {
          if (paired) {
            // Lattice recognizes the private key and remembers if this
            // client is already paired between sessions
            lattice.deriveAddresses()
          } else {
            lattice.status = Status.PAIRING
            emitUpdate()
          }
        })

        lattice.on('paired', (hasActiveWallet: boolean) => {
          if (hasActiveWallet) {
            lattice.deriveAddresses()
          }
        })

        lattice.on('close', () => {
          delete this.knownSigners[deviceId]
          this.emit('remove', lattice.id)
        })

        this.knownSigners[deviceId] = lattice
        this.emit('add', lattice)

        const { deviceName, baseUrl, privateKey } = getLatticeSettings(lattice.deviceId)
        lattice.connect(deviceName, baseUrl, privateKey)
      })
    })
  }

  close () {
    if (this.signerObserver) {
      this.signerObserver.remove()
      this.signerObserver = null
    }
    
    if (this.settingsObserver) {
      this.settingsObserver.remove()
      this.settingsObserver = null
    }
  }
}