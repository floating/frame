import log from 'electron-log'

import { SignerAdapter } from '../adapters'
import store from '../../store'
import Lattice from './Lattice'

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
      // if any connection settings have changed, re-connect

      // Lattice supports a name with a max of 24 characters
      const suffix = store('main.latticeSettings.suffix')
      const deviceName = suffix ? `Frame-${suffix.substring(0, 18)}` : 'Frame'

      const endpointMode = store('main.latticeSettings.endpointMode')
      const baseUrl = (endpointMode === 'custom')
        ? store('main.latticeSettings.endpointCustom')
        : 'https://signing.gridpl.us'

      Object.values(this.knownSigners).forEach(lattice => {
        if (!lattice.connection) return

        const privateKey = store('main.lattice', lattice.deviceId, 'privKey')

        if (
          deviceName !== lattice.connection.name ||
          baseUrl !== lattice.connection.baseUrl ||
          privateKey !== lattice.connection.privKey
        ) {
          //lattice.disconnect().then(() => lattice.connect(deviceName, baseUrl, privateKey))
        }
      })

      const accountLimit = store('main.latticeSettings.accountLimit')
    })

    this.signerObserver = store.observer(() => {
      const lattice = store('main.lattice') || {}

      Object.keys(lattice).forEach(deviceId => {
        if (!deviceId || store('main.signers', 'lattice-' + deviceId)) return

        log.debug('Connecting to Lattice device', { deviceId })

        const lattice = new Lattice(deviceId)

        this.emit('add', lattice)
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