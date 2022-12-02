import LedgerEthereumApp from '../../../../../main/signers/ledger/Ledger/eth'
import { Derivation } from '../../../../../main/signers/Signer/derive'
import log from 'electron-log'

import { openTransportReplayer, RecordStore } from '@ledgerhq/hw-transport-mocker'

// -------------------
// uncomment this version of eth app creation to record interactions with the Ledger so they can be replayed.
// when test is done, call `recordStore.toString()` to print ADPU exchange codes.
// it also seems there is a bug in the `createTransportRecorder()` code, to fix it, change the line
// (_a = DecoratedTransport.constructor).open.apply(...) in the `open`
// method definition to (_a = DecoratedTransport).open.apply(...)
// -------------------

// let recordStore = RecordStore.fromString('')

// async function createEthApp () {

//   const Recorder = createTransportRecorder(TransportNodeHid, recordStore)

//   return Recorder.open(getDevices()[0].path).then(t => {
//     return new LedgerEthereumApp(t)
//   })
// }

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

async function createEthApp(replayCodes = '') {
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

    expect(signature).toBe(
      '0x5dfbee187e688cddacd854f3ed514c5a0a84ae972fe9ddeafb06436c92d7b1421ad9b725c7270d2c5b32ef824e0700ae354471a644d9cd06cb9f3422feba213100'
    )
  }, 100)

  it('signs a message with no hex prefix', async () => {
    const replayData = `
      => e008000026058000002c800000018000000000000000000000060000000d68656c6c6f2c204672616d6521
      <= 1ce5d40722e7df2660b8f7b68367ea885ddc68d4da701bb04565f60252909127e72cfe480f7227a2a3f6e8753d4ac9f4e3526f65d78fa3fbcc1ec3b3148bd85e329000
    `

    const ethApp = await createEthApp(replayData)
    const signature = await ethApp.signMessage("44'/1'/0'/0/6", '68656c6c6f2c204672616d6521')

    expect(signature).toBe(
      '0xe5d40722e7df2660b8f7b68367ea885ddc68d4da701bb04565f60252909127e72cfe480f7227a2a3f6e8753d4ac9f4e3526f65d78fa3fbcc1ec3b3148bd85e3201'
    )
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

  it('fails to sign a message when rejected by the user', async () => {
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

describe('#signTypedData', () => {
  const typedData = {
    domain: {
      chainId: '4',
      name: 'Ether Mail',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      version: '1'
    },
    message: {
      contents: 'Hello, Bob!',
      from: {
        name: 'Cow',
        wallets: ['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF']
      },
      to: [
        {
          name: 'Bob',
          wallets: [
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
            '0xB0B0b0b0b0b0B000000000000000000000000000'
          ]
        }
      ]
    },
    primaryType: 'Mail',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Group: [
        { name: 'name', type: 'string' },
        { name: 'members', type: 'Person[]' }
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person[]' },
        { name: 'contents', type: 'string' }
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallets', type: 'address[]' }
      ]
    }
  }

  it('signs valid v4 typed data', async () => {
    const replayData = `
      => e00c000051048000002c8000003c80000000000000003173a9c41e96ee138ed70f662fc9412ce2542bd7135229c5ca739a62faff853beb4221181ff3f1a83ea7313993ca9218496e424604ba9492bb4052c03d5c3df8
      <= 1bee800a5a7e4e1668a8ebab2a5bce4c96424e0f80b7ba08fc48e063393196e0851c0f9dab8909655368974e8aec6dba5c15772d575189e31b894fb7f8286c63b99000
    `

    const ethApp = await createEthApp(replayData)
    const signature = await ethApp.signTypedData("44'/60'/0'/0", typedData)

    expect(signature).toBe(
      '0xee800a5a7e4e1668a8ebab2a5bce4c96424e0f80b7ba08fc48e063393196e0851c0f9dab8909655368974e8aec6dba5c15772d575189e31b894fb7f8286c63b900'
    )
  }, 100)

  it('fails to sign typed data with an invalid BIP 32 path', async () => {
    const replayData = `
      => e00c000041003173a9c41e96ee138ed70f662fc9412ce2542bd7135229c5ca739a62faff853beb4221181ff3f1a83ea7313993ca9218496e424604ba9492bb4052c03d5c3df8
      <= 6a80
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signTypedData('badpath', typedData)
      throw new Error('signed typed data with invalid path!')
    } catch (e) {
      expect(e.statusCode).toBe(27264)
    }
  }, 100)

  it('fails to sign typed data when rejected by the user', async () => {
    const replayData = `
      => e00c000051048000002c8000003c80000000000000003173a9c41e96ee138ed70f662fc9412ce2542bd7135229c5ca739a62faff853beb4221181ff3f1a83ea7313993ca9218496e424604ba9492bb4052c03d5c3df8
      <= 6985
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signTypedData("44'/60'/0'/0", typedData)
      throw new Error('signed rejected typed data!')
    } catch (e) {
      expect(e.statusCode).toBe(27013)
    }
  }, 100)
})

describe('#signTransaction', () => {
  const legacyTx = {
    from: '0x46bdba9c90ea453426d0b8d4a7a8a99b8a9dade5',
    to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
    value: '0x5af3107a4000',
    data: '0x',
    gasLimit: '0x5208',
    gasPrice: '0x1dcd65000',
    chainId: '0x4',
    type: '0x0',
    nonce: '0x5'
  }

  const eip1559Tx = {
    from: '0x46bdba9c90ea453426d0b8d4a7a8a99b8a9dade5',
    to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
    value: '0x5af3107a4000',
    data: '0x',
    gasLimit: '0x5208',
    chainId: '0x4',
    type: '0x2',
    maxPriorityFeePerGas: '0x3b9aca00',
    maxFeePerGas: '0x3b9aca0b',
    nonce: '0x6'
  }

  it('signs a pre-EIP-1193 transaction', async () => {
    const replayData = `
      => e00400003c048000002c8000003c8000000000000000ea058501dcd65000825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a400080048080
      <= 2b87cdd3a45082a1d86c4dab5a1944360a69543dba2acacea01f19133a7ddef11578365690e4bdcf1bb58242bb673d53f94d525bee4217b0f191048eaca8cade739000
    `
    const ethApp = await createEthApp(replayData)
    const signature = await ethApp.signTransaction("44'/60'/0'/0", legacyTx)

    expect(signature).toBe(
      '0xf86a058501dcd65000825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a4000802ba087cdd3a45082a1d86c4dab5a1944360a69543dba2acacea01f19133a7ddef115a078365690e4bdcf1bb58242bb673d53f94d525bee4217b0f191048eaca8cade73'
    )
  }, 100)

  it('signs an EIP-1193 transaction', async () => {
    const replayData = `
      => e004000040048000002c8000003c800000000000000002ed0406843b9aca00843b9aca0b825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a400080c0
      <= 01ebefc9f798b04e3952310d6b82c48fda245df9edef77507d06025cdc5af4efa1570784cbcf84a0f03cac7771fbfeee4f4759034baf42ca735065554afa600ee39000
    `

    const ethApp = await createEthApp(replayData)
    const signature = await ethApp.signTransaction("44'/60'/0'/0", eip1559Tx)

    expect(signature).toBe(
      '0x02f8700406843b9aca00843b9aca0b825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a400080c001a0ebefc9f798b04e3952310d6b82c48fda245df9edef77507d06025cdc5af4efa1a0570784cbcf84a0f03cac7771fbfeee4f4759034baf42ca735065554afa600ee3'
    )
  }, 100)

  it('fails to sign a transaction with an invalid BIP 32 path', async () => {
    const replayData = `
      => e004000040048000002c8000003c800000000000000002ed0406843b9aca00843b9aca0b825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a400080c0
      <= 6a80
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signTransaction('badpath', eip1559Tx)
      throw new Error('signed transaction with invalid path!')
    } catch (e) {
      expect(e).toBeTruthy()
    }
  }, 100)

  it('fails to sign a transaction when rejected by the user', async () => {
    const replayData = `
      => e004000040048000002c8000003c800000000000000002ed0406843b9aca00843b9aca0b825208942f318c334780961fb129d2a6c30d0763d9a5c970865af3107a400080c0
      <= 6985
    `

    const ethApp = await createEthApp(replayData)

    try {
      await ethApp.signTransaction("44'/60'/0'/0", eip1559Tx)
      throw new Error('signed rejected transaction!')
    } catch (e) {
      expect(e.statusCode).toBe(27013)
    }
  }, 100)
})
