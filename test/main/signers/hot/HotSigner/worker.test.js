import { HotSignerWorker } from '../../../../../main/signers/hot/HotSigner/worker'

let worker

// mnemonic: test test test test test test test test test test test junk
const key = Buffer.from('4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356', 'hex')
let errorOutput = console.error

beforeAll(() => {
  errorOutput = console.error
  console.error = jest.fn()
})

afterAll(() => {
  console.error = errorOutput
})

beforeEach(() => {
  worker = new HotSignerWorker()
})

describe('#signTransaction', () => {
  const rawTx = {
    from: '0xa8967e43a9b18e665ba26f649a66e790d9325600',
    to: '0xbe188d6641e8b680743a4815dfa0f6208038960f',
    value: '0xb5e620f48000',
    data: '0x',
    gasLimit: '0x5208',
    type: '0x0',
    gasPrice: '0xb2d05e00'
  }

  const chains = [
    { name: 'mainnet', chainId: 1, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008025a0c8ca5f76f568578bebbdfc257be09d8e8a4512d0ffd45e991da86be8141d97e0a037179047d9810e211657d9dd60d4bac66ed576fd65ef65a55f007314587036ec' },
    { name: 'rinkeby', chainId: 4, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f48000802ca0c711e0a0f6881bb8a4b8fff57f2ddd7539a1f72acd59706b2e2765c16dc05155a0698f6af80657857a0e8ba47632995fbec987bc427abf88d1c1c65c80dd67c8b9' },
    { name: 'goerli', chainId: 5, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f48000802da074c3b69fa979e92253c7f66d323f91f7f11eb16dd2b4838a274b584ddb708895a03e76e91351b2be3fd4a065195a0c71a4359d0fe4230f5f3ae457b2cb5a30bf03' },
    { name: 'optimism', chainId: 10, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008024a0ac95e29896e43248e2e91cbedb4fb367c3a4bf3100ac55ebf914ed8582f4e189a0240abc49b1178721a08cba8c95aea43f2a6daf2da34f7c9641fc1de253edada8' },
    { name: 'optimistic kovan', chainId: 69, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f48000807ea08e096de4291afc19b88e46fa0bfb4e9d5a1073fb9e9534f7c0cb89ff81641a1ba05b357d98228466f265b4e782b80d78baba244af2fb335b77754a82fff471a0a4' },
    { name: 'xdai', chainId: 100, expectedSignature: '0xf86a8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008081a3a0de2c8b5a1ecccdb10fe7e524ff751cd15c8f93284c7cbb7de2a13a0e481bac83a01260a408c58b7d783be08fe6d073b5390581225ec48e8b9fafe97ce096870c89' },
    { name: 'polygon', chainId: 137, expectedSignature: '0xf86a8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008081d5a0d62d318003814f6ba963495353111d6923207ba972b539c49d89ad06a9062f2da00ff0ec849d44a6768262fafb040e343e2d2472c4eee8c833eacb2321038c7737' },
    { name: 'arbitrum', chainId: 42161, expectedSignature: '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008024a0ac95e29896e43248e2e91cbedb4fb367c3a4bf3100ac55ebf914ed8582f4e189a0240abc49b1178721a08cba8c95aea43f2a6daf2da34f7c9641fc1de253edada8' },
    { name: 'polygon-mumbai', chainId: 80001, expectedSignature: '0xf86b8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f4800080826c95a0202d3b445db101e46ed9f91c6849117efa00a98fb52da4612d2790de1e1f6749a01a050bcb2819efe1bfd1276aa1fcc7ee66cd700a52f261cabb376f4e75d660be' }
  ]

  chains.forEach(chain => {
    it(`signs a transaction on ${chain.name}`, done => {
      const tx = { ...rawTx, chainId: chain.chainId.toString(16) }

      worker.signTransaction(key, tx, (err, signature) => {
        try {
          expect(err).toBe(null)
          expect(signature).toBe(chain.expectedSignature)
          done()
        } catch (e) { done(e) }
      })
    }, 200)
  })

  it('rejects a transaction with an unknown chain id', done => {
    const { chainId, ...tx } = rawTx

    worker.signTransaction(key, tx, err => {
      try {
        expect(err).toBe('could not determine chain id for transaction')
        done()
      } catch (e) { done(e) }
    })
  }, 200)
})
