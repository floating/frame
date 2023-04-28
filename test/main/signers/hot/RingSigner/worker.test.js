import RingSignerWorker from '../../../../../main/signers/hot/RingSigner/worker'

import { assertDone } from '../../../../util'

jest.mock('crypto')

let worker

// mnemonic: test test test test test test test test test test test junk
const key = '4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356'
const password = 'afr@metest!'

beforeAll((done) => {
  worker = new RingSignerWorker()

  const unlockCb = (_err, encryptedKeys) => {
    worker.unlock(done, { encryptedSecret: encryptedKeys, password })
  }

  worker.addKey(unlockCb, { key, password })
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
    {
      name: 'mainnet',
      chainId: 1,
      expectedSignature:
        '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008025a0c8ca5f76f568578bebbdfc257be09d8e8a4512d0ffd45e991da86be8141d97e0a037179047d9810e211657d9dd60d4bac66ed576fd65ef65a55f007314587036ec'
    },
    {
      name: 'goerli',
      chainId: 5,
      expectedSignature:
        '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f48000802da074c3b69fa979e92253c7f66d323f91f7f11eb16dd2b4838a274b584ddb708895a03e76e91351b2be3fd4a065195a0c71a4359d0fe4230f5f3ae457b2cb5a30bf03'
    },
    {
      name: 'optimism',
      chainId: 10,
      expectedSignature:
        '0xf8698084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008037a06340cc640986ddbc095d65bdd5217e4f25168e0fb7d097e4f6ce1c739e4adb96a0645e1173cf2fdc318c4af839dd52a3dc408b0c60b0246e96a0b0f5bf7edbe614'
    },
    {
      name: 'optimistic kovan',
      chainId: 69,
      expectedSignature:
        '0xf86a8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008081aea0a0df2fd26c2f8a5e9531d6cbe7c8246d2f82a1524e17c545076e7637e0dcf338a028629bc1ae46c5e27eeb2cb41b9a87618e2224778138be8cb4e5c17d1c8d3494'
    },
    {
      name: 'xdai',
      chainId: 100,
      expectedSignature:
        '0xf86a8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008081eba021839bde3d4c41b1fb83c5c97e7d9cb4f4d4fc86fc338faa44a3a223db4213a5a0157a154afec7aa17cd94f9c7a6a1545f701a99f0e1edb4997504eb9fd3ad8813'
    },
    {
      name: 'polygon',
      chainId: 137,
      expectedSignature:
        '0xf86b8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f4800080820135a09235ef8a65bff6d8e117bd13653fafcb2225763f4a11aa29886464530e009cfaa03fcd6b8ac39c1b3f375efcd3e4558b5c44cf167f2de800a63a008a86ed3dba25'
    },
    {
      name: 'arbitrum',
      chainId: 42161,
      expectedSignature:
        '0xf86c8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008083014985a07f874b1f31b10c8ec507f74a3803f6d6a52e93790e9e502bcf74b2cc07bb169aa013ff12c35ed91966d8e3f042971c0fab1d236f5888af7315007baa0eab0938c9'
    },
    {
      name: 'polygon-mumbai',
      chainId: 80001,
      expectedSignature:
        '0xf86c8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f480008083027126a00f42c66986e1d7ca6e77891e3cf0cd8fe360ed0a92732523bf29756f18e37255a07688e781db1d625a2c4234c5a61c3a9093643a326060caf5b58ad05fdf1f4233'
    },
    {
      name: 'sepolia',
      chainId: 11155111,
      expectedSignature:
        '0xf86d8084b2d05e0082520894be188d6641e8b680743a4815dfa0f6208038960f86b5e620f48000808401546d72a0cf0656010c7e68ba6ad17a528f1e0280ec7b96ae93a2edbee399e771a2d46c85a07d77731cb4218a55bccc690d49238a82bc3051884356eb57bc2e582b57d5a46a'
    }
  ]

  chains.forEach((chain) => {
    it(`signs a transaction on ${chain.name}`, (done) => {
      const tx = { ...rawTx, chainId: chain.chainId.toString(16) }

      const cb = (err, signature) => {
        try {
          expect(err).toBe(null)
          expect(signature).toBe(chain.expectedSignature)
          done()
        } catch (e) {
          done(e)
        }
      }

      worker.signTransaction(cb, { index: 0, rawTx: tx })
    }, 200)
  })

  it('rejects a transaction with an unknown chain id', (done) => {
    const { chainId, ...tx } = rawTx

    const cb = (err) => {
      try {
        expect(err).toBe('could not determine chain id for transaction')
        done()
      } catch (e) {
        done(e)
      }
    }

    worker.signTransaction(cb, { index: 0, rawTx: tx })
  }, 200)
})

describe('#addKey', () => {
  const privateKey = '3a34930e00e54f8ac777ca94286a069c88dcf9d4e49503b38849f1a036bdcb03'
  const password = 'somepassw0rd'

  it('adds an additional private key', (done) => {
    const cb = (err, keys) => {
      assertDone(() => {
        expect(err).toBeNull()
        expect(keys).toBe(
          '01010101010101010101010101010101:01010101010101010101010101010101:6efd31f2e9b59f0e3881ac7a9ccb35f1f43d614e90c5b05074b596d844e05e6fd8a0ed9482eaffc72b100a2dee983fde9132e6ec61985b6e4ed308cc63dbcf5e13408b94316afec95a6e8a036ef7811f'
        )
      }, done)
    }

    worker.addKey(cb, { key: privateKey, password })
  })
})
