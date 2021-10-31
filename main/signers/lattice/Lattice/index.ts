import Client from 'gridplus-sdk'

import Signer, { Callback } from '../../Signer'

export default class Lattice extends Signer {
  deviceId: string;
  connection: Client | undefined;

  constructor (deviceId: string) {
    super()

    this.id = 'lattice-' + deviceId
    this.deviceId = deviceId
    this.type = 'lattice'
    this.status = 'loading'
    
  }

  async connect (name: string, baseUrl: string, privateKey: string) {
    this.connection = new Client({
      name, baseUrl, privKey: privateKey
    })

    // this.connection.connect()
  }
}
