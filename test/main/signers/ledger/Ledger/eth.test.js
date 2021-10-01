import LedgerEthereumApp, { Derivation } from '../../../../../main/signers/ledger/Ledger/eth'

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

it.skip('test conflict', async () => {
  const ethApp = await createEthApp()

  setTimeout(() => {
    ethApp.signMessage(Derivation.legacy, 1, 'test', (err, res) => {
      console.log({ err, res })
    })
  }, 1500)

  return new Promise(resolve => {
    setInterval(() => {
      ethApp.getAddress("44'/60'/0'/0").then(console.log)
    }, 1000)
  })
}, 20000)

describe('#getPath', () => {
  let ethApp

  beforeEach(async () => {
    ethApp = await createEthApp()
  })

  it('constructs a path using legacy derivation', async () => {
    expect(ethApp.getPath(Derivation.legacy, 2)).toBe("44'/60'/0'/2")
  })

  it('constructs a path using standard derivation', async () => {
    expect(ethApp.getPath(Derivation.standard, 8)).toBe("44'/60'/0'/0/8")
  })

  it('constructs a path using testnet derivation', async () => {
    expect(ethApp.getPath(Derivation.testnet, 0)).toBe("44'/1'/0'/0/0")
  })

  it('constructs a path using live derivation', async () => {
    expect(ethApp.getPath(Derivation.live, 9)).toBe("44'/60'/9'/0/0")
  })
})

describe('#deriveAddresses', () => {
  it('derives legacy addresses', done => {
    const replayData = `
      => e00200010d038000002c8000003c80000000
      <= 4104953d5604f014fc80e9dc6b53b2b21bac4a302aaa387edd03966feb9906f40f019a6ff8f0d28338d28edc3dd518414313e7a200281e98f371791da3814a02b3022846383432303066463835333344394266343739346445333130373465454339303733396635383332f2c0f99fea11ef57a110f8184b6139d7dc7f0a66091e6ad8cf02ebae74b6ce119000
    `

    createEthApp(replayData).then(ethApp => {
      const stream = ethApp.deriveAddresses(Derivation.legacy)
      let addresses = []

      stream.on('addresses', derivedAddresses => addresses = [...derivedAddresses])

      stream.on('close', () => {
        expect(addresses.length).toBe(100)
        expect(addresses[0].toLowerCase()).toBe('0x46bdba9c90ea453426d0b8d4a7a8a99b8a9dade5')

        done()
      })
    })
  }, 200)

  it('derives standard addresses', done => {
    const replayData = `
      => e002000111048000002c8000003c8000000000000000
      <= 4104859f899683f20dbf6140126aabadb61d3c14f6b4ab125a5f8017e3ed790ada06ccd136314c44f75869d35e769ef757aa98873277f452a15d5f379afda7501f372834364264624139433930456134353334323664304238643441374138413939623841396441644535507c01b73ae632f464ee3219fca2b0ed77c1e30610d4fa55a5d9a79b8a9e07e89000
    `

    createEthApp(replayData).then(ethApp => {
      const stream = ethApp.deriveAddresses(Derivation.standard)
      let addresses = []

      stream.on('addresses', derivedAddresses => addresses = [...derivedAddresses])

      stream.on('close', () => {
        expect(addresses.length).toBe(100)
        expect(addresses[5].toLowerCase()).toBe('0xe001da2733a5dc2ce5191de0534282683f05f0b8')

        done()
      })
    })
  }, 200)

  it('derives testnet addresses', done => {
    const replayData = `
      => e002000111048000002c800000018000000000000000
      <= 4104ebe39e90499809ab8006d70e57ef44c27bc4d741ba9128d5d63abd9a25cb399b7a7b2d5e4f537d5c5d437b08c2c7de3dd9bd60022edfcea76a423bd3f9f0cfbe2831353339303341424439373543633937374465313632466236344446326344313739343034364338f53fe9e4eb5e26fda34b4377c58e0a32ac822548ab9419aa917af5d7e104eb729000
    `

    createEthApp(replayData).then(ethApp => {
      const stream = ethApp.deriveAddresses(Derivation.testnet)
      let addresses = []

      stream.on('addresses', derivedAddresses => addresses = [...derivedAddresses])

      stream.on('close', () => {
        expect(addresses.length).toBe(100)
        expect(addresses[3].toLowerCase()).toBe('0xaffb4ca2ed8738dd409b7563052b3e7c7bdaabdb')

        done()
      })
    })
  }, 200)

  it('derives live addresses', done => {
    const replayData = `
      => e002000015058000002c8000003c800000000000000000000000
      <= 410493e7cf2e96c01a503af43190d3622fc957771d5c163b422c246111d23a2a0de79bdef09922bf3ba89feefda7e16923146668d9275ec8546ebe87064a2f348cad28313264416544394232306536313232426465653464456263613535304545413133303131613737349000
      => e002000015058000002c8000003c800000010000000000000000
      <= 410447ec77ffd9772153a272e985337249e8bd335d6440d95de873d374d6f19708c5a42738da4a3f4057fe07de69c6dcd06dcc93b869a30896a869e2d48ff6b15b9128394645383232344541323030354165384566363731463436623765326266324633363133653338399000
      => e002000015058000002c8000003c800000020000000000000000
      <= 4104512f50b59aca3ae7edf724764d86a3c9d4b2e0e9fe3fe4a5b0355c942dd7f8c699364d98d00b426688c7c6d38b53b0874e793cea3698f9385f33851c6d8caa7328343539613642363636463442356635303241393966423943396532304465363739343232376330379000
    `

    const expectedAddresses = 3
    const addresses = []

    createEthApp(replayData).then(ethApp => {
      const stream = ethApp.deriveAddresses(Derivation.live, expectedAddresses)

      stream.on('addresses', derivedAddresses => addresses.push(derivedAddresses[0]))

      stream.on('close', () => {
        expect(addresses.length).toBe(expectedAddresses)
        
        expect(addresses[0].toLowerCase()).toBe('0x12daed9b20e6122bdee4debca550eea13011a774')
        expect(addresses[1].toLowerCase()).toBe('0x9fe8224ea2005ae8ef671f46b7e2bf2f3613e389')
        expect(addresses[2].toLowerCase()).toBe('0x459a6b666f4b5f502a99fb9c9e20de6794227c07')

        done()
      })
    })
  }, 100)
})
