import provider from '../../../main/provider'
import accounts from '../../../main/accounts'
import connection from '../../../main/chains'
import store from '../../../main/store'
import chainConfig from '../../../main/chains/config'
import { weiToHex, gweiToHex } from '../../../resources/utils'
import { Type as SignerType } from '../../../main/signers/Signer'

import { validate as validateUUID } from 'uuid'
import { utils } from 'ethers'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

const address = '0x22dd63c3619818fdbc262c78baee43cb61e9cccf'

let accountRequests = []

jest.mock('../../../main/store')
jest.mock('../../../main/chains', () => ({ send: jest.fn(), syncDataEmit: jest.fn(), on: jest.fn() }))
jest.mock('../../../main/accounts', () => ({}))

beforeAll(async () => {
  log.transports.console.level = false

  jest.useFakeTimers()

  accounts.getAccounts = () => [address]
  accounts.addRequest = (req, res) => {
    store.set('main.accounts', req.account, 'requests', { [req.handlerId]: req })
    accountRequests.push(req)
    if (res) res()
  }
})

afterAll(() => {
  log.transports.console.level = 'debug'
  jest.useRealTimers()
})

beforeEach(() => {
  provider.handlers = {}

  const eventTypes = ['accountsChanged', 'chainChanged', 'chainsChanged', 'assetsChanged', 'networkChanged']
  eventTypes.forEach(eventType => provider.subscriptions[eventType] = [])

  accountRequests = []
  store.set('main.accounts', {})
  store.set('main.currentNetwork.id', 1)

  connection.send = jest.fn()
  connection.connections = {
    ethereum: {
      1: { chainConfig: chainConfig(1, 'london'), primary: { connected: true }},
      4: { chainConfig: chainConfig(4, 'london'), primary: { connected: true }}
    }
  }

  accounts.current = jest.fn(() => ({ id: address, getAccounts: () => [address] }))
  accounts.get = jest.fn(addr => addr === address ? { address, lastSignerType: 'ring' } : undefined)
  accounts.signTransaction = jest.fn()
  accounts.setTxSigned = jest.fn()
})

describe('#getRawTx', () => {
  it('leaves a valid value unchanged', () => {
    const tx = provider.getRawTx({ value: '0x2540be400' })

    expect(tx.value).toBe('0x2540be400')
  })

  it('removes a leading zero from a valid value', () => {
    const tx = provider.getRawTx({ value: '0x0a45c6' })

    expect(tx.value).toBe('0xa45c6')
  })

  it('leaves a valid zero value unchanged', () => {
    const tx = provider.getRawTx({ value: '0x0' })

    expect(tx.value).toBe('0x0')
  })

  it('turns a zero value into the correct hex value for zero', () => {
    const tx = provider.getRawTx({ value: '0x' })

    expect(tx.value).toBe('0x0')
  })

  it('turns an un-prefixed zero value into the correct hex value for zero', () => {
    const tx = provider.getRawTx({ value: '0' })

    expect(tx.value).toBe('0x0')
  })

  it('turns an undefined value into the correct hex value for zero', () => {
    const tx = provider.getRawTx({ value: undefined })

    expect(tx.value).toBe('0x0')
  })
})

describe('#send', () => {
  const send = (request, cb = jest.fn()) => provider.send(request, cb)

  it('passes the given target chain to the connection', () => {
    connection.connections.ethereum[10] = { chainConfig: { hardfork: 'london', chainId: 10 }, primary: { connected: true } }

    const request = { method: 'eth_testFrame' }

    send({ ...request, chainId: '0xa' })

    expect(connection.send).toHaveBeenCalledWith(request, expect.any(Function), { type: 'ethereum', id: 10 })
  })

  it('passes the default target chain to the connection when none is given', () => {
    store.set('main.currentNetwork.id', 137)

    const request = { method: 'eth_testFrame' }

    send(request)

    expect(connection.send).toHaveBeenCalledWith(request, expect.any(Function), { type: 'ethereum', id: 137 })
  })

  it('returns an error when an unknown chain is given', () => {
    const request = { method: 'eth_testFrame', chainId: '0x63' }

    send(request, response => {
      expect(connection.send).not.toHaveBeenCalled()
      expect(response.error.message).toMatch(/unknown chain/)
      expect(response.result).toBe(undefined)
    })
  })

  it('returns an error when an invalid chain is given', () => {
    const request = { method: 'eth_testFrame', chainId: 'test' }

    send(request, response => {
      expect(connection.send).not.toHaveBeenCalled()
      expect(response.error.message).toMatch(/unknown chain/)
      expect(response.result).toBe(undefined)
    })
  })

  describe('#eth_chainId', () => {
    it('returns the current chain id from the store', () => {
      store.set('main.networks.ethereum', 1, { id: 1 })
      store.set('main.currentNetwork', { type: 'ethereum', id: 1 })

      send({ method: 'eth_chainId' }, response => {
        expect(response.result).toBe('0x1')
      })
    })

    it('returns a chain id from the target chain', () => {
      store.set('main.networks.ethereum', 4, { id: 4 })

      send({ method: 'eth_chainId', chainId: '0x4' }, response => {
        expect(response.result).toBe('0x4')
      })
    })

    it('returns an error for a disconnected chain', () => {
      connection.connections.ethereum[11] = { chainConfig: chainConfig(11, 'london'), primary: { connected: false } }

      send({ method: 'eth_chainId', chainId: '0xb' }, response => {
        expect(response.error.message).toBe('not connected')
        expect(response.result).toBeUndefined()
      })
    })
  })

  describe('#wallet_addEthereumChain', () => {
    it('adds the current chain to the store', done => {
      send({ 
        method: 'wallet_addEthereumChain', 
        params: [
          {
            chainId: '0x1234', // A 0x-prefixed hexadecimal string
            chainName: 'New Chain',
            nativeCurrency: {
              name: 'New',
              symbol: 'NEW', // 2-6 characters long
              decimals: 18
            },
            rpcUrls: ['https://pylon.link'],
            blockExplorerUrls: ['https://pylon.link'],
            iconUrls: [''] // Currently ignored
          }
        ] 
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('addChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })

    it('adds switch chain request if chain exists', done => {
      store.set('main.networks.ethereum', 1, { id: 1 })
      store.set('main.currentNetwork', { type: 'ethereum', id: 137 })

      send({ 
        method: 'wallet_addEthereumChain', 
        params: [
          {
            chainId: '0x1', // A 0x-prefixed hexadecimal string
            chainName: 'Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH', // 2-6 characters long
              decimals: 18
            },
            rpcUrls: ['https://pylon.link'],
            blockExplorerUrls: ['https://pylon.link'],
            iconUrls: [''] // Currently ignored
          }
        ] 
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('switchChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })
  })

  describe('#wallet_switchEthereumChain', () => {
    it('switches to chain if chain exists in store', done => {
      store.set('main.currentNetwork', { type: 'ethereum', id: 42161 })

      send({ 
        method: 'wallet_switchEthereumChain', 
        params: [{
          chainId: '0x1'
        }]
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('switchChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })

    it('rejects switch if chain doesn\'t exist in the store', done => {
      send({
        method: 'wallet_switchEthereumChain', 
        params: [{
          chainId: '0x1234'
        }]
      }, () => {
        try {
          expect(accountRequests).toHaveLength(0)
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })
  })
  
  describe('#wallet_getPermissions', () => {
    it('returns all allowed permissions', done => {
      const request = {
        method: 'wallet_getPermissions'
      }

      send(request, response => {
        try {
          expect(response.error).toBe(undefined)

          const permissions = response.result
          expect(permissions).toHaveLength(15)
          expect(permissions.map(p => p.parentCapability)).toEqual(expect.arrayContaining(
            [
              'eth_coinbase',
              'eth_accounts',
              'eth_requestAccounts',
              'eth_sendTransaction',
              'eth_sendRawTransaction',
              'personal_sign',
              'personal_ecRecover',
              'eth_sign',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
              'wallet_switchEthereumChain',
              'wallet_addEthereumChain',
              'wallet_getAssets'
            ]
          ))

          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('#wallet_requestPermissions', () => {
    it('returns the requested permissions', done => {
      const request = {
        method: 'wallet_requestPermissions',
        params: [
          { eth_accounts: {} },
          { eth_signTransaction: {} }
        ]
      }

      send(request, response => {
        try {
          expect(response.error).toBe(undefined)

          const permissions = response.result
          expect(permissions).toHaveLength(2)
          expect(permissions[0].parentCapability).toBe('eth_accounts')
          expect(Number.isInteger(permissions[0].date)).toBe(true)
          expect(permissions[1].parentCapability).toBe('eth_signTransaction')
          expect(Number.isInteger(permissions[1].date)).toBe(true)
          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('#wallet_watchAsset', () => {
    let request
    
    beforeEach(() => {
      store.set('main.currentNetwork', { type: 'ethereum', id: 1 })
      store.set('main.tokens.custom', [])

      request = {
        id: 10,
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e',
            symbol: 'BADGER',
            name: 'BadgerDAO Token',
            decimals: 18,
            image: 'https://badgerdao.io/icon.jpg'
          }
        }
      }
    })

    it('adds a request for a custom token', () => {
      send(request, () => {
        expect(accountRequests).toHaveLength(1)
        expect(validateUUID(accountRequests[0].handlerId)).toBe(true)
        expect(accountRequests[0]).toEqual(
          expect.objectContaining({
            type: 'addToken',
            account: address,
            token: {
              chainId: 1,
              address: '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e',
              symbol: 'BADGER',
              name: 'BadgerDAO Token',
              decimals: 18,
              logoURI: 'https://badgerdao.io/icon.jpg'
            },
            payload: request
          })
        )
      })
    })

    it('does not add a request for a token that is already added', () => {
      store.set('main.tokens.custom', [{ address: '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e', chainId: 1 }])

      send(request, ({ result }) => {
        expect(result).toBe(true)
        expect(accountRequests).toHaveLength(0)
      })
    })

    it('rejects a request with no type', () => {
      delete request.params.type

      send(request, ({ error }) => {
        expect(error.code).toBe(-1)
        expect(error.message).toMatch('only ERC-20 tokens are supported')
        expect(accountRequests).toHaveLength(0)
      })
    })

    it('rejects a request with for a non-ERC-20 token', () => {
      request.params.type = 'ERC721'

      send(request, ({ error }) => {
        expect(error.code).toBe(-1)
        expect(error.message).toMatch('only ERC-20 tokens are supported')
        expect(accountRequests).toHaveLength(0)
      })
    })

    it('rejects a request with no token address', () => {
      delete request.params.options.address

      send(request, ({ error }) => {
        expect(error.code).toBe(-1)
        expect(error.message).toMatch('tokens must define an address')
        expect(accountRequests).toHaveLength(0)
      })
    })
  })

  describe('#wallet_getChains', () => {
    it('returns a list of active chains', () => {
      store.set('main.networks.ethereum', {
        137: { name: 'polygon', id: 137, on: true },
        4: { name: 'rinkeby', id: 4, on: false },
        1: { name: 'mainnet', id: 1, on: true }
      })

      send({ method: 'wallet_getChains', id: 14, jsonrpc: '2.0' }, response => {
        expect(response.error).toBe(undefined)
        expect(response.id).toBe(14)
        expect(response.jsonrpc).toBe('2.0')
        expect(response.result).toEqual(['0x1', '0x89'])
      })
    })
  })

  describe('#wallet_getAssets', () => {
    const balances = [
      {
        address: '0x3472a5a71965499acd81997a54bba8d852c6e53d',
        chainId: 137,
        name: 'Polygon Badger',
        symbol: 'BADGER',
        balance: '0x1605d9ee98627100000',
        decimals: 18,
        displayBalance: '6500'
      },
      {
        address: '0x383518188c0c6d7730d91b2c03a03c837814a899',
        chainId: 1,
        name: 'Olympus DAO',
        symbol: 'OHM',
        balance: '0xd14d13208',
        decimals: 9,
        displayBalance: '56.183829'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 42161,
        name: 'Ether',
        symbol: 'AETH',
        balance: '0xd8f8753a603f70000',
        decimals: 18,
        displayBalance: '250.15'
      }
    ]

    beforeEach(() => {
      store.set('main.accounts', address, { balances: { lastUpdated: new Date() } })
      store.set('main.balances', address, balances)
    })

    it('returns an error if no account is selected', done => {
      accounts.current.mockReturnValueOnce(undefined)

      send({ method: 'wallet_getAssets', id: 21, jsonrpc: '2.0' }, response => {
        expect(response.id).toBe(21)
        expect(response.jsonrpc).toBe('2.0')
        expect(response.result).toBe(undefined)
        expect(response.error.message.toLowerCase()).toMatch(/no account selected/)
        done()
      })
    })

    it('returns native currencies from all chains', done => {
      send({ method: 'wallet_getAssets' }, response => {
        expect(response.error).toBe(undefined)
        expect(response.result.nativeCurrency).toHaveLength(1)

        expect(response.result.nativeCurrency[0]).toEqual(expect.objectContaining(balances[2]))

        done()
      })
    })

    it('returns erc20 tokens from all chains', done => {
      send({ method: 'wallet_getAssets' }, response => {
        expect(response.error).toBe(undefined)
        expect(response.result.erc20).toHaveLength(2)

        expect(response.result.erc20[0]).toEqual(expect.objectContaining(balances[0]))
        expect(response.result.erc20[1]).toEqual(expect.objectContaining(balances[1]))

        done()
      })
    })

    it('returns an error while scanning', done => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      store.set('main.accounts', address, 'balances.lastUpdated', yesterday)

      send({ method: 'wallet_getAssets', id: 51, jsonrpc: '2.0' }, response => {
        expect(response.id).toBe(51)
        expect(response.jsonrpc).toBe('2.0')
        expect(response.result).toBe(undefined)
        expect(response.error.code).toBe(5901)
        done()
      })
    })
  })

  describe('#eth_getTransactionByHash', () => {
    const chain = 4
    const txHash = '0x06c1c968d4bd20c0ebfed34f6f34d8a5d189d9d2ce801f2ee8dd45dac32628d5'
    const request = { method: 'eth_getTransactionByHash', params: [txHash], chainId: '0x' + chain.toString(16) }

    let blockResult

    beforeEach(() => {
      connection.send.mockImplementation((payload, res, targetChain) => {
        expect(targetChain.id).toBe(chain)
        expect(payload.params[0]).toBe(txHash)

        return res({ result: blockResult })
      })
    })

    it('returns the response from the connection', done => {
      blockResult = {
        blockHash: '0xc1b0227f0721a05357b2b417e3872c5f6f01da209422013fe66ee291527fb123',
        blockNumber: '0xc80d08'
      }

      send(request, response => {
        expect(response.result.blockHash).toBe('0xc1b0227f0721a05357b2b417e3872c5f6f01da209422013fe66ee291527fb123')
        expect(response.result.blockNumber).toBe('0xc80d08')
        done()
      })
    })

    it('uses maxFeePerGas as the gasPrice if one is not defined', done => {
      const fee = `0x${(10e9).toString(16)}`

      blockResult = {
        maxFeePerGas: fee
      }

      send(request, response => {
        expect(response.result.gasPrice).toBe(fee)
        expect(response.result.maxFeePerGas).toBe(fee)
        done()
      })
    })

    it('maintains the gasPrice if maxFeePerGas exists', done => {
      const gasPrice = `0x${(8e9).toString(16)}`
      const maxFeePerGas = `0x${(10e9).toString(16)}`

      blockResult = {
        gasPrice,
        maxFeePerGas
      }

      send(request, response => {
        expect(response.result.gasPrice).toBe(gasPrice)
        expect(response.result.maxFeePerGas).toBe(maxFeePerGas)
        done()
      })
    })

    it('returns a response with no result attribute', done => {
      mockConnectionError('no transaction!')

      send(request, response => {
        expect(response.error.message).toBe('no transaction!')
        done()
      })
    })
  })

  describe('#eth_sendTransaction', () => {
    let tx

    const sendTransaction = (cb, chainId) => {
      const payload = {
        jsonrpc: '2.0',
        id: 7,
        method: 'eth_sendTransaction',
        params: [tx]
      }

      if (chainId) payload.chainId = chainId

      provider.send(payload, cb)
    }

    beforeEach(() => {
      tx = {
        from: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
        to: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
        chainId: '0x1',
        gasLimit: weiToHex(21000),
        type: '0x1',
        nonce: '0xa'
      }

      const chainIds = [1, 137]

      chainIds.forEach(chainId => {
        store.set('main.networksMeta.ethereum', chainId, 'gas', {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: gweiToHex(30), asap: '', custom: '' },
            fees: {
              maxPriorityFeePerGas: gweiToHex(1),
              maxBaseFeePerGas: gweiToHex(8)
            }
          }
        })

        connection.connections.ethereum[chainId] = {
          chainConfig: chainConfig(chainId, chainId === 1 ? 'london' : 'istanbul')
        }
      })
    })

    it('rejects a transaction with a mismatched chain id', done => {
      sendTransaction(response => {
        try {
          expect(response.result).toBe(undefined)
          expect(response.error.message.toLowerCase()).toMatch(/does not match/)
          done()
        } catch (e) { done(e) }
      }, '0x4')
    })

    it('populates the transaction with the request chain id if not provided in the transaction', done => {
      delete tx.chainId

      sendTransaction(() => {
        try {
          const initialRequest = accountRequests[0]
          expect(initialRequest.data.chainId).toBe('0x89')
          done()
        } catch (e) { done(e) }
      }, '0x89')
    })

    it('maintains transaction chain id if no target chain provided with the request', done => {
      tx.chainId = '0x89'

      sendTransaction(() => {
        try {
          const initialRequest = accountRequests[0]
          expect(initialRequest.data.chainId).toBe('0x89')
          done()
        } catch (e) { done(e) }
      })
    })

    it('pads the gas estimate from the network by 50 percent', done => {
      connection.send.mockImplementationOnce((payload, cb) => {
        expect(payload.method).toBe('eth_estimateGas')
        cb({ result: addHexPrefix((150000).toString(16)) })
      })

      delete tx.gasLimit

      sendTransaction(() => {
        try {
          const initialRequest = accountRequests[0]
          expect(initialRequest.data.gasLimit).toBe(addHexPrefix((225000).toString(16)))
          done()
        } catch (e) { done(e) }
      })
    })

    describe('replacing gas fees', () => {
      beforeEach(() => {
        const chainIds = [1, 137]

        chainIds.forEach(chainId => {
          store.set('main.networksMeta.ethereum', chainId, 'gas', {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: gweiToHex(30), asap: '', custom: '' },
              fees: {
                maxPriorityFeePerGas: gweiToHex(1),
                maxBaseFeePerGas: gweiToHex(8)
              }
            }
          })

          connection.connections.ethereum[chainId] = {
            chainConfig: chainConfig(chainId, chainId === 1 ? 'london' : 'istanbul')
          }
        })
      })
      
      it('adds a 10% gas buffer when replacing a legacy transaction', done => {
        tx.type = '0x0'
        tx.chainId = addHexPrefix((137).toString(16))

        try {
          sendTransaction(() => {
            const initialRequest = accountRequests[0]
            const initialPrice = initialRequest.data.gasPrice
    
            expect(initialPrice).toBe(gweiToHex(30))
            expect(initialRequest.feesUpdatedByUser).toBeFalsy()
    
            initialRequest.mode = 'monitor'
    
            sendTransaction(() => {
              const replacementRequest = accountRequests[1]
              const bumpedPrice = Math.ceil(initialPrice * 1.1)
              expect(replacementRequest.data.gasPrice).toBe(weiToHex(bumpedPrice))
              expect(replacementRequest.feesUpdatedByUser).toBe(true)
              done()
            })
          })
        } catch (e) {
         done(e) 
        }
      })
      
      it('does not add a buffer to replacement legacy transactions if the current gas price is already higher', done => {
        tx.type = '0x0'
        tx.chainId = addHexPrefix((137).toString(16))

        try {
          sendTransaction(() => {
            const initialRequest = accountRequests[0]
            const initialPrice = initialRequest.data.gasPrice
    
            expect(initialPrice).toBe(gweiToHex(30))
            expect(initialRequest.feesUpdatedByUser).toBeFalsy()
    
            initialRequest.mode = 'monitor'
    
            store.set('main.networksMeta.ethereum', 137, 'gas', {
              price: {
                selected: 'standard',
                levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
                fees: {
                  maxPriorityFeePerGas: gweiToHex(1),
                  maxBaseFeePerGas: gweiToHex(8)
                }
              }
            })
            
            sendTransaction(() => {
              const replacementRequest = accountRequests[1]
              expect(replacementRequest.data.gasPrice).toBe(gweiToHex(40))
              expect(replacementRequest.feesUpdatedByUser).toBeFalsy()
              done()
            })
          })
        } catch (e) {
         done(e)
        }
      })
  
      it('adds a 10% gas buffer when replacing an EIP-1559 transaction', done => {
        tx.type = '0x2'
        tx.chainId = addHexPrefix((1).toString(16))

        try {
          sendTransaction(() => {
            const initialRequest = accountRequests[0]
            const initialTip = initialRequest.data.maxPriorityFeePerGas
            const initialMax = initialRequest.data.maxFeePerGas
    
            expect(initialTip).toBe(gweiToHex(1))
            expect(initialMax).toBe(gweiToHex(9))
            expect(initialRequest.feesUpdatedByUser).toBeFalsy()

            initialRequest.mode = 'monitor'

            sendTransaction(() => {
              const replacementRequest = accountRequests[1]
              const bumpedFee = Math.ceil(initialTip * 1.1)
              const bumpedBase = Math.ceil((initialMax - initialTip) * 1.1)
              const bumpedMax = bumpedFee + bumpedBase
    
              expect(replacementRequest.data.maxPriorityFeePerGas).toBe(weiToHex(bumpedFee))
              expect(replacementRequest.data.maxFeePerGas).toBe(weiToHex(bumpedMax))
              expect(replacementRequest.feesUpdatedByUser).toBe(true)
              done()
            })
          })
        } catch (e) {
         done(e) 
        }
      })
      
      it('buffers only the priority fee for replacement EIP-1559 transactions if the current base price is high enough for replacement', done => {
        tx.type = '0x2'
        tx.chainId = addHexPrefix((1).toString(16))

        try {
          sendTransaction(() => {
            const initialRequest = accountRequests[0]
            const initialTip = initialRequest.data.maxPriorityFeePerGas
            const initialMax = initialRequest.data.maxFeePerGas
    
            expect(initialTip).toBe(gweiToHex(1))
            expect(initialMax).toBe(gweiToHex(9))
            expect(initialRequest.feesUpdatedByUser).toBeFalsy()
    
            initialRequest.mode = 'monitor'

            store.set('main.networksMeta.ethereum', 1, 'gas', {
              price: {
                selected: 'standard',
                levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
                fees: {
                  maxPriorityFeePerGas: gweiToHex(1),
                  maxBaseFeePerGas: gweiToHex(20)
                }
              }
            })
    
            sendTransaction(() => {
              const replacementRequest = accountRequests[1]
              const bumpedFee = Math.ceil(initialTip * 1.1)
              expect(replacementRequest.data.maxPriorityFeePerGas).toBe(weiToHex(bumpedFee))
              expect(replacementRequest.data.maxFeePerGas).toBe(weiToHex((20 * 1e9) + bumpedFee))
              expect(replacementRequest.feesUpdatedByUser).toBe(true)
              done()
            })
          })
        } catch (e) {
         done(e)
        }
      })
      
      it('does not add a buffer to replacement EIP-1559 transactions if the current gas price is already higher', done => {
        tx.type = '0x2'
        tx.chainId = addHexPrefix((1).toString(16))

        try {
          sendTransaction(() => {
            const initialRequest = accountRequests[0]
            const initialTip = initialRequest.data.maxPriorityFeePerGas
            const initialMax = initialRequest.data.maxFeePerGas
    
            expect(initialTip).toBe(gweiToHex(1))
            expect(initialMax).toBe(gweiToHex(9))
            expect(initialRequest.feesUpdatedByUser).toBeFalsy()
    
            initialRequest.mode = 'monitor'
            store.set('main.networksMeta.ethereum', 1, 'gas', {
              price: {
                selected: 'standard',
                levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
                fees: {
                  maxPriorityFeePerGas: gweiToHex(2),
                  maxBaseFeePerGas: gweiToHex(14)
                }
              }
            })
    
            sendTransaction(() => {
              const replacementRequest = accountRequests[1]
    
              expect(replacementRequest.data.maxPriorityFeePerGas).toBe(gweiToHex(2))
              expect(replacementRequest.data.maxFeePerGas).toBe(gweiToHex(16))
              expect(replacementRequest.feesUpdatedByUser).toBeFalsy()
              done()
            })
          })
        } catch (e) {
         done(e)
        }
      })
    })
  })

  describe('#eth_sign', () => {
    const message = 'hello, Ethereum!'

    it('submits a request to sign a message', () => {
      send({ method: 'eth_sign', params: [address, message] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = ['0xa4581bfe76201f3aa147cce8e360140582260441', message]

      send({ method: 'eth_sign', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)
  })

  describe('#personal_sign', () => {
    const message = 'hello, Ethereum!'

    it('submits a request to sign a personal message with the address first', () => {
      send({ method: 'personal_sign', params: [message, address] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('submits a request to sign a personal message with the message first', () => {
      send({ method: 'personal_sign', params: [address, message] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = [message, '0xa4581bfe76201f3aa147cce8e360140582260441']

      send({ method: 'personal_sign', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)
  })

  describe('#eth_signTypedData', () => {
    const typedData = {
      types: {
          EIP712Domain: 'domain',
          Bid: 'bid',
          Identity: 'identity',
      },
      domain: 'domainData',
      primaryType: 'Bid',
      message: 'message'
    }

    const validRequests = [
      // the first 2 parameters are reversed for V1
      { method: 'eth_signTypedData', params: [typedData, address], version: 'V1' },
      { method: 'eth_signTypedData_v1', params: [typedData, address], version: 'V1' },
      { method: 'eth_signTypedData_v3', params: [address, typedData], version: 'V3' },
      { method: 'eth_signTypedData_v4', params: [address, typedData], version: 'V4' }
    ]

    function verifyRequest (version) {
      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(typedData)
      expect(accountRequests[0].version).toBe(version)
    }
    
    validRequests.forEach(({ method, params, version }) => {
      it(`submits a ${method} request to sign typed data`, () => {
        send({ method, params })
  
        verifyRequest(version)
      })
    })

    it('handles typed data as a stringified json param', () => {
      const params = [JSON.stringify(typedData), address]

      send({ method: 'eth_signTypedData', params })

      verifyRequest('V1')
    })

    it('does not submit a request from an unknown account', done => {
      const params = ['0xa4581bfe76201f3aa147cce8e360140582260441', typedData]

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error.message).toBeTruthy()
        expect(err.error.code).toBe(-1)
        done()
      })
    })

    it('does not submit a request with malformed type data', done => {
      const params = [address, 'test']

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error.message).toBeTruthy()
        expect(err.error.code).toBe(-1)
        done()
      })
    })

    // these signers only support V4+
    const hardwareSigners = [SignerType.Ledger, SignerType.Lattice, SignerType.Trezor]

    hardwareSigners.forEach(signerType => {
      it(`does not submit a V3 request to a ${signerType}`, done => {
        accounts.get.mockImplementationOnce(addr => {
          return addr === address ? { address, lastSignerType: signerType } : {}
        })

        const params = [address, typedData]

        send({ method: 'eth_signTypedData_v3', params }, err => {
          expect(err.error.message).toMatch(new RegExp(signerType, 'i'))
          expect(err.error.code).toBe(-1)
          done()
        })
      })
    })

    const unknownVersions = ['_v5', '_v1.1', 'v3']

    unknownVersions.forEach(versionExtension => {
      it(`passes a request with unhandled method eth_signTypedData${versionExtension} through to the connection`, done => {
        mockConnectionError('received unhandled request')
  
        const params = [address, 'test']
  
        send({ method: `eth_signTypedData${versionExtension}`, params }, err => {
          expect(err.error.message).toBe('received unhandled request')
          done()
        })
      })
    })
  })

  describe('subscriptions', () => {
    const eventTypes = ['accountsChanged', 'chainChanged', 'chainsChanged', 'networkChanged']

    describe('#eth_subscribe', () => {
      const subscribe = (eventType, cb) => send({ id: 9, jsonrpc: '2.0', method: 'eth_subscribe', params: [eventType] }, cb)

      eventTypes.forEach(eventType => {
        it(`subscribes to ${eventType} events`, () => {
          subscribe(eventType, response => {
            expect(response.id).toBe(9)
            expect(response.jsonrpc).toBe('2.0')
            expect(response.error).toBe(undefined)
            expect(response.result).toMatch(/0x\w{32}$/)

            expect(provider.subscriptions[eventType]).toHaveLength(1)
          })
        })
      })

      it('returns an error from the node if attempting to unsubscribe to an unknown event', () => {
        mockConnectionError('unknown event!')
  
        subscribe('everythingChanged', response => {
          expect(response.id).toBe(9)
          expect(response.jsonrpc).toBe('2.0')
          expect(response.error.message).toBe('unknown event!')
          expect(response.result).toBe(undefined)
        })
      })
    })

    describe('#eth_unsubscribe', () => {
      const unsubscribe = (id, cb) => send({ id: 8, jsonrpc: '2.0', method: 'eth_unsubscribe', params: [id] }, cb)
  
      eventTypes.forEach(eventType => {
        it(`unsubscribes from ${eventType} events`, () => {
          const subId = '0x1acc2933618a0ff548f03b1c99420366'
          provider.subscriptions[eventType] = [subId]
  
          unsubscribe(subId, response => {
            expect(response.id).toBe(8)
            expect(response.jsonrpc).toBe('2.0')
            expect(response.error).toBe(undefined)
            expect(response.result).toBe(true)
            expect(provider.subscriptions[eventType]).toHaveLength(0)
          })
        })
      })
  
      it('returns an error from the node if attempting to unsubscribe from an unknown subscription', () => {
        mockConnectionError('unknown subscription!')
  
        provider.subscriptions.accountsChanged = ['0xtest1']
        provider.subscriptions.chainChanged = ['0xtest2']
        provider.subscriptions.chainsChanged = ['0xtest2']
        provider.subscriptions.networkChanged = ['0xtest3']
  
        unsubscribe('0xanothersub', response => {
          expect(response.id).toBe(8)
          expect(response.jsonrpc).toBe('2.0')
          expect(response.error.message).toBe('unknown subscription!')
          expect(response.result).toBe(undefined)

          eventTypes.forEach(eventType => {
            expect(provider.subscriptions[eventType]).toHaveLength(1)
          })
        })
      })
    })
  })
})

describe('#signAndSend', () => {
  let tx = {}, request = {}

  const signAndSend = (cb = jest.fn()) => provider.signAndSend(request, cb)

  beforeEach(() => {
    tx = {}

    request = {
      handlerId: 99,
      payload: { jsonrpc: '2.0', id: 2, method: 'eth_sendTransaction' },
      data: tx
    }
  })

  it('allows a Fantom transaction with fees over the mainnet hard limit', done => {
    // 200 gwei * 10M gas = 2 FTM
    tx.chainId = '0xfa'
    tx.type = '0x0'
    tx.gasPrice = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    accounts.signTransaction.mockImplementation(() => done())

    signAndSend(done)
  })
  
  it('does not allow a pre-EIP-1559 transaction with fees that exceeds the hard limit', done => {
    // 200 gwei * 10M gas = 2 ETH
    tx.chainId = '0x1'
    tx.type = '0x0'
    tx.gasPrice = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    signAndSend(err => {
      try {
        expect(err.message).toMatch(/over hard limit/)
        done()
      } catch (e) { done(e) }
    })
  })
  
  it('does not allow a post-EIP-1559 transaction with fees that exceed the hard limit', done => {
    // 200 gwei * 10M gas = 2 ETH
    tx.chainId = '0x1'
    tx.type = '0x2'
    tx.maxFeePerGas = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    signAndSend(err => {
      try {
        expect(err.message).toMatch(/over hard limit/)
        done()
      } catch (e) { done(e) }
    })
  })

  describe('#fillTransaction', () => {
    beforeEach(() => {
      connection.send.mockImplementationOnce((payload, cb) => {
        expect(payload.method).toBe('eth_estimateGas')
        cb({ result: addHexPrefix((150000).toString(16)) })
      })

      store.set('main.networksMeta.ethereum.1.gas', {
        price: {
          selected: 'standard',
          levels: { slow: '', standard: '', fast: gweiToHex(30), asap: '', custom: '' },
          fees: {
            maxPriorityFeePerGas: gweiToHex(1),
            maxBaseFeePerGas: gweiToHex(8)
          }
        }
      })
    })

    it('should not include an undefined "to" field', done => {
      const txJson = {
        chainId: '0x1'
      }

      provider.fillTransaction(txJson, (err, { tx }) => {
        try {
          expect(err).toBeFalsy()
          expect('to' in tx).toBe(false)
          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('broadcasting transactions', () => {
    const signedTx = '0x2eca5b929f8a671f0a3c0a7996f83141b2260fdfac62a1da8a8098b326001b99'
    const txHash = '0x6e8b1de115105ceab599b4d99604797b961cfd1f46b85e10f23a81974baae3d5'

    beforeEach(() => {
      accounts.signTransaction.mockImplementation((_, cb) => cb(null, signedTx))
      accounts.setTxSigned.mockImplementation((reqId, cb) => {
        expect(reqId).toBe(request.handlerId)
        cb()
      })
    })

    describe('success', () => {
      beforeEach(() => {
        connection.send.mockImplementation((payload, cb) => {
          expect(payload).toEqual(expect.objectContaining({
            id: request.payload.id,
            method: 'eth_sendRawTransaction',
            params: [signedTx]
          }))
          
          cb({ result: txHash })
        })
      })

      it('sends a successfully signed transaction', done => {
        signAndSend((err, result) => {
          try {
            expect(err).toBe(null)
            expect(result).toBe(txHash)
            done()
          } catch (e) { done(e) }
        })
      })

      it('responds to a successful transaction request with the transaction hash result', done => {
        provider.handlers[request.handlerId] = response => {
          try {
            expect(response.result).toBe(txHash)
            done()
          } catch (e) { done(e) }
        }

        signAndSend()
      })
    })

    describe('failure', () => {
      let errorMessage = 'invalid transaction!'

      beforeEach(() => {
        mockConnectionError(errorMessage)
      })

      it('handles a transaction send failure', done => {
        signAndSend(err => {
          expect(err.message).toBe(errorMessage)
          done()
        })
      })

      it('responds to a failed transaction request with the payload', done => {
        provider.handlers[request.handlerId] = err => {
          expect(err.id).toBe(request.payload.id)
          expect(err.jsonrpc).toBe(request.payload.jsonrpc)
          expect(err.error.message).toBe(errorMessage)
          done()
        }

        signAndSend()
      })
    })
  })
})

describe('state change events', () => {
  describe('#chainChanged', () => {
    it('fires a chainChanged event to subscribers', done => {
      const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'

      provider.once('data', event => {
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toBe('0x89')
        done()
      })

      store.set('main.currentNetwork.id', 137)
      provider.subscriptions.chainChanged.push(subscriptionId)

      store.getObserver('provider:chains').fire()
    })
  })

  describe('#chainsChanged', () => {
    const networks = {
      1: {
        name: 'test',
        id: 1,
        on: true
      },
      4: {
        name: 'rinkeby',
        id: 4,
        on: true
      },
      10: {
        name: 'optimism',
        id: 10,
        on: false
      }
    }

    beforeEach(() => {
      store.set('main.networks.ethereum', networks)
      store.getObserver('provider:chains').fire()
    })

    it('fires a chainsChanged event when a chain is added', done => {
      const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'

      provider.once('data', event => {
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual(['0x1', '0x4', '0x89'])
        done()
      })

      const polygon = {
        name: 'polygon',
        id: 137,
        on: true
      }

      store.set('main.networks.ethereum', { ...networks, 137: polygon })
      provider.subscriptions.chainsChanged.push(subscriptionId)

      store.getObserver('provider:chains').fire()
    })

    it('fires a chainsChanged event when a chain is removed', done => {
      const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'

      provider.once('data', event => {
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual(['0x1'])
        done()
      })

      store.set('main.networks.ethereum', { 1: networks[1] })
      provider.subscriptions.chainsChanged.push(subscriptionId)

      store.getObserver('provider:chains').fire()
    })

    it('fires a chainsChanged event when a chain connection is turned off', done => {
      const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'

      provider.once('data', event => {
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual(['0x1', '0x4', '0xa'])
        done()
      })

      const chains = { ...networks, 10: { ...networks[10], on: true } }
      store.set('main.networks.ethereum', chains)
      provider.subscriptions.chainsChanged.push(subscriptionId)

      store.getObserver('provider:chains').fire()
    })

    it('fires a chainsChanged event when a chain connection is turned off', done => {
      const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'

      provider.once('data', event => {
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual(['0x1'])
        done()
      })

      const chains = { ...networks, 4: { ...networks[4], on: false } }
      store.set('main.networks.ethereum', chains)
      provider.subscriptions.chainsChanged.push(subscriptionId)

      store.getObserver('provider:chains').fire()
    })
  })

  describe('#assetsChanged', () => {
    const subscriptionId = '0x9509a964a8d24a17fcfc7b77fc575b71'
    const account = '0xce070f8134f69a4d55cc4bef4a7c8d0bb56ff1d9'

    beforeEach(() => {
      accounts.current = () => ({ id: account })
      store.set('main.accounts', account, 'balances.lastUpdated', new Date())

      provider.subscriptions.assetsChanged.push(subscriptionId)
      provider.removeAllListeners('data:address')
    })

    it('fires an assetsChanged event when native currency assets are present', done => {
      const balance = {
        symbol: 'ETH',
        balance: '0xe7',
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1
      }

      store.set('main.balances', account, [balance])

      const priceData = { usd: { price: 3815.91 } }
      store.set('main.networksMeta.ethereum.1.nativeCurrency', priceData)

      provider.once('data:address', ((accountId, event) => {
        expect(accountId).toBe(account)
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual({
          account,
          nativeCurrency: [{ ...balance, currencyInfo: priceData }],
          erc20: []
        })

        done()
      }))

      store.set('selected.current', account)
      store.getObserver('provider:account').fire()
      jest.advanceTimersByTime(800)
    })

    it('fires an assetsChanged event when erc20 assets are present', done => {
      const balance = {
        symbol: 'OHM',
        balance: '0x606401fc9',
        address: '0x383518188c0c6d7730d91b2c03a03c837814a899'
      }

      store.set('main.balances', account, [balance])

      const priceData = { usd: { price: 225.35 } }
      store.set('main.rates', balance.address, priceData)

      provider.once('data:address', ((accountId, event) => {
        expect(accountId).toBe(account)
        expect(event.method).toBe('eth_subscription')
        expect(event.jsonrpc).toBe('2.0')
        expect(event.params.subscription).toBe(subscriptionId)
        expect(event.params.result).toEqual({
          account,
          nativeCurrency: [],
          erc20: [{ ...balance, tokenInfo: { lastKnownPrice: { ...priceData } } }]
        })

        done()
      }))

      store.set('selected.current', account)
      store.getObserver('provider:account').fire()
      jest.advanceTimersByTime(800)
    })

    it('does not fire an assetsChanged event when no account is selected', () => {
      provider.once('data:address', () => { throw new Error('event fired when no account selected!') })

      store.set('main.balances', account, [{ address: '0xany' }])
      store.set('selected.current', undefined)

      store.getObserver('provider:account').fire()
    })

    it('does not fire an assetsChanged event when no assets are present', () => {
      provider.once('data:address', () => { throw new Error('event fired when account has no assets!') })

      store.set('main.balances', account, [])
      store.set('selected.current', account)

      store.getObserver('provider:account').fire()
    })

    it('does not fire an assetsChanged event while scanning', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      store.set('main.accounts', account, 'balances.lastUpdated', yesterday)
      store.set('main.balances', account, [{ address: '0xany' }])
      store.set('selected.current', account)

      return new Promise((resolve, reject) => {
        provider.once('data:address', () => reject('event fired while still scanning!'))

        store.getObserver('provider:account').fire()
        jest.advanceTimersByTime(800)

        resolve()
      })
    })
  })
})

// utility functions //

function mockConnectionError (message) {
  connection.send.mockImplementation((p, cb) => cb({ id: p.id, jsonrpc: p.jsonrpc, error: { message, code: -1 } }))
}
