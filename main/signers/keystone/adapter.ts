import log from 'electron-log'

// @ts-ignore
import { v5 as uuid, stringify } from 'uuid'

import { SignerAdapter } from '../adapters'
import Keystone from './Keystone'
import store from '../../store'
import { CryptoAccount, CryptoHDKey, ETHSignature } from "@keystonehq/bc-ur-registry-eth";
import { SignRequest } from "./Keystone/KeystoneInteractionProvider";

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

export default class KeystoneSignerAdapter extends SignerAdapter {
  private knownSigners: { [id: string]: Keystone }
  private observer: any;
  private signerObserver: any;

  constructor() {
    super('keystone')

    this.knownSigners = {}
  }

  open() {
    this.observer = store.observer( () => {
      const devices: {type: string, cbor: string}[] = store('main.keystone.devices') || []
      devices.forEach(device => {
        if(device){
          const id = this.getDeviceId(device)
          if(!this.knownSigners[id]){
            this.handleSyncDevice(device, id)
          }
        }
      })
    })

    this.signerObserver = store.observer(() => {
      const signRequests = store('main.keystone.signRequests')
      const signature = store('main.keystone.signature')

      if(signature){
        const currentSignRequest = signRequests.find((signRequest: SignRequest) => {
          const ethSignature = ETHSignature.fromCBOR(Buffer.from(signature.cbor, 'hex'))
          const requestId = ethSignature.getRequestId()
          if (!requestId){
            log.error(`signer requestId missing`)
            return ''
          }
          const signId = stringify(requestId)
          return signId === signRequest.request.requestId
        })

        if(currentSignRequest){
          const {signerId, request} = currentSignRequest
          const currentSigner = this.knownSigners[signerId]
          currentSigner.keystoneKeyring.submitSignature(request.requestId, signature.cbor)
        }
      }
    })

    super.open()
  }

  close() {
    if (this.observer) {
      this.observer.remove()
      this.observer = null
    }

    super.close()
  }

  remove(keystone: Keystone) {
    if (keystone.id in this.knownSigners) {
      log.info(`removing Keystone ${keystone.id}`)
      const devices: {type: string, cbor: string}[] = store('main.keystone.devices') || []
      const restDevices = devices.filter(device => {
        const id = this.getDeviceId(device)
        return id !== keystone.id
      })

      delete this.knownSigners[keystone.id]
      store.updateKeystone(restDevices)

      keystone.close()
    }
  }

  private getDeviceId({type, cbor}: {type: string, cbor: string}): string{
    if(type === 'crypto-account'){
      const cryptoAccount = CryptoAccount.fromCBOR(Buffer.from(cbor, 'hex'))
      return uuid(`Keystone${cryptoAccount.getRegistryType()?.getType()}-${cryptoAccount.getMasterFingerprint().toString("hex")}`, ns)
    } else {
      const cryptoHDKey = CryptoHDKey.fromCBOR(Buffer.from(cbor, 'hex'))
      return uuid(`Keystone${cryptoHDKey.getNote()}${cryptoHDKey.getParentFingerprint()!.toString("hex")}`, ns)
    }
  }

  private handleSyncDevice(ur: {type: string, cbor: string}, id: string) {
    const keystone = new Keystone(id)
    keystone.syncKeyring(ur)

    const emitUpdate = () => this.emit('update', keystone)

    keystone.on('update', emitUpdate)
    keystone.on('error', emitUpdate)

    this.knownSigners[id] = keystone

    keystone.deriveAddresses()
  }
}
