import LedgerEthereumApp from '../../../../../main/signers/ledger/Ledger/eth'

import { Derivation } from '../../../../../main/signers/Signer/derive'

import {
  createTransportRecorder,
  openTransportReplayer,
  RecordStore,
} from '@ledgerhq/hw-transport-mocker'
import TransportNodeHid, { getDevices } from '@ledgerhq/hw-transport-node-hid-noevents'

let recordStore = RecordStore.fromString('')

// async function createEthApp () {
//   const Recorder = createTransportRecorder(TransportNodeHid, recordStore)

//   return Recorder.open(getDevices()[0].path).then(t => {
//     console.log('OPENING')
//     return new LedgerEthereumApp(t)
//   })
// }

async function createEthApp (replayCodes = '') {
  const record = RecordStore.fromString(replayCodes)
  const transport = await openTransportReplayer(record)

  return new LedgerEthereumApp(transport)
}

describe('#deriveAddresses', () => {
  it('derives legacy addresses', async () => {
    const replayData = `
      => e00200010d038000002c8000003c80000000
      <= 4104953d5604f014fc80e9dc6b53b2b21bac4a302aaa387edd03966feb9906f40f019a6ff8f0d28338d28edc3dd518414313e7a200281e98f371791da3814a02b3022846383432303066463835333344394266343739346445333130373465454339303733396635383332f2c0f99fea11ef57a110f8184b6139d7dc7f0a66091e6ad8cf02ebae74b6ce119000
    `

    const ethApp = await createEthApp(replayData)
    const addresses = await ethApp.deriveAddresses(Derivation.legacy)

    expect(addresses.length).toBe(100)
    expect(addresses[0].toLowerCase()).toBe('0x46bdba9c90ea453426d0b8d4a7a8a99b8a9dade5')
  }, 200)

  it('derives standard addresses', async () => {
    const replayData = `
      => e002000111048000002c8000003c8000000000000000
      <= 4104859f899683f20dbf6140126aabadb61d3c14f6b4ab125a5f8017e3ed790ada06ccd136314c44f75869d35e769ef757aa98873277f452a15d5f379afda7501f372834364264624139433930456134353334323664304238643441374138413939623841396441644535507c01b73ae632f464ee3219fca2b0ed77c1e30610d4fa55a5d9a79b8a9e07e89000
    `

    const ethApp = await createEthApp(replayData)
    const addresses = await ethApp.deriveAddresses(Derivation.standard)

    expect(addresses.length).toBe(100)
    expect(addresses[5].toLowerCase()).toBe('0xe001da2733a5dc2ce5191de0534282683f05f0b8')
  }, 200)

  it('derives testnet addresses', async () => {
    const replayData = `
      => e002000111048000002c800000018000000000000000
      <= 4104ebe39e90499809ab8006d70e57ef44c27bc4d741ba9128d5d63abd9a25cb399b7a7b2d5e4f537d5c5d437b08c2c7de3dd9bd60022edfcea76a423bd3f9f0cfbe2831353339303341424439373543633937374465313632466236344446326344313739343034364338f53fe9e4eb5e26fda34b4377c58e0a32ac822548ab9419aa917af5d7e104eb729000
    `

    const ethApp = await createEthApp(replayData)
    const addresses = await ethApp.deriveAddresses(Derivation.testnet)

    expect(addresses.length).toBe(100)
    expect(addresses[3].toLowerCase()).toBe('0xaffb4ca2ed8738dd409b7563052b3e7c7bdaabdb')
  }, 200)

  it('fails to find addresses for an unknown derivation', async () => {
    const ethApp = await createEthApp()

    try {
      await ethApp.deriveAddresses(Derivation.live)
      throw new Error('live addresses derived incorrectly!')
    } catch (e) {
      expect(e).toBeTruthy()
    }
  }, 100)
})

describe('#signMessage', () => {
  it('signs a message with a hex prefix', async () => {
    const replayData = `
      => e008000026058000002c8000003c8000000000000000000000020000000d68656c6c6f2c204672616d6521
      <= 1b5dfbee187e688cddacd854f3ed514c5a0a84ae972fe9ddeafb06436c92d7b1421ad9b725c7270d2c5b32ef824e0700ae354471a644d9cd06cb9f3422feba21319000
    `

    const ethApp = await createEthApp(replayData)                 
    const signature = await ethApp.signMessage("44'/60'/0'/0/2", '0x68656c6c6f2c204672616d6521')

    expect(signature).toBe('0x5dfbee187e688cddacd854f3ed514c5a0a84ae972fe9ddeafb06436c92d7b1421ad9b725c7270d2c5b32ef824e0700ae354471a644d9cd06cb9f3422feba213100')
  }, 100)

  it('signs a message with no hex prefix', async () => {
    const replayData = `
      => e008000026058000002c800000018000000000000000000000060000000d68656c6c6f2c204672616d6521
      <= 1ce5d40722e7df2660b8f7b68367ea885ddc68d4da701bb04565f60252909127e72cfe480f7227a2a3f6e8753d4ac9f4e3526f65d78fa3fbcc1ec3b3148bd85e329000
    `

    const ethApp = await createEthApp(replayData)
    const signature = await ethApp.signMessage("44'/1'/0'/0/6", '68656c6c6f2c204672616d6521')

    expect(signature).toBe('0xe5d40722e7df2660b8f7b68367ea885ddc68d4da701bb04565f60252909127e72cfe480f7227a2a3f6e8753d4ac9f4e3526f65d78fa3fbcc1ec3b3148bd85e3201')
  }, 100)

  it('fails to sign a message with an invalid BIP 32 path', async () => {
    const replayData = `
      => e008000012000000000d68656c6c6f2c204672616d6521
      <= 6a80
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signMessage('badpath', '0x68656c6c6f2c204672616d6521')
      throw new Error('signed message with invalid path!')
    } catch (e) {
      expect(e.statusCode).toBe(27264)
    }
  }, 100)

  it('fails a sign a message when rejected by the user', async () => {
    const replayData = `
      => e008000022048000002c8000003c80000001000000040000000d68656c6c6f2c204672616d6521
      <= 6985
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signMessage("44'/60'/1'/4", '0x68656c6c6f2c204672616d6521')
      throw new Error('signed rejected message!')
    } catch (e) {
      expect(e.statusCode).toBe(27013)
    }
  }, 100)
})
