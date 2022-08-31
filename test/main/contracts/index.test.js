import log from 'electron-log'
import nock from 'nock'

import { fetchAbi } from '../../../main/contracts'

function mockApiResponse (domain, path, status, body, headers = { 'content-type': 'application/json' }) {
  nock(`https://${domain}`)
    .get(path)
    .reply(status, body, headers)
}

const mockAbi = [
  { 
    inputs: [],
    name: 'retrieve',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  { 
    inputs:[{ internalType:'uint256', name: 'num', type:'uint256'}],
    name: 'store',
    outputs:[],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const sourcifyResponse = {
  status: 'partial',
  files: [{
    name: 'metadata.json',
    path: '',
    content: JSON.stringify({
      output: {
        abi: mockAbi, 
        devdoc: { title: 'mock sourcify abi' }
      }
    })
  }]
}

const scanResponse = {
  message: 'OK',
  result: [{
    ABI: JSON.stringify(mockAbi),
    ContractName: 'mock scan abi'
  }]
}

const scanNotFoundResponse = {
  message: 'OK',
  result: [{
    ABI: 'Contract source code not verified',
    ContractName: ''
  }]
}

beforeAll(() => {
  nock.disableNetConnect()
  log.transports.console.level = false
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  log.transports.console.level = 'debug'
})

describe('#fetchAbi', () => {
  it('retrieves an ABI from sourcify by default', async () => {
    mockApiResponse('sourcify.dev', '/server/files/any/1/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 200, sourcifyResponse)
    mockApiResponse('api.etherscan.io', '/api?module=contract&action=getsourcecode&address=0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24', 200, scanResponse)

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x1')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })

  it('retrieves an ABI from *scan when the sourcify request fails', async () => {
    mockApiResponse('sourcify.dev', '/server/files/any/1/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 400, '')
    mockApiResponse('api.etherscan.io', '/api?module=contract&action=getsourcecode&address=0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24', 200, scanResponse)

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x1')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock scan abi', 
      source: 'etherscan'
    })
  })

  it('retrieves an ABI from sourcify when the *scan request fails', async () => {
    mockApiResponse('sourcify.dev', '/server/files/any/1/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 200, sourcifyResponse)
    mockApiResponse('api.etherscan.io', '/api?module=contract&action=getsourcecode&address=0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24', 400, '')

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x1')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })

  it('does not retrieve an ABI when it is not found via *scan and the chain is supported for *scan lookup', async () => {
    mockApiResponse('sourcify.dev', '/server/files/any/1/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 200, sourcifyResponse)
    mockApiResponse('api.etherscan.io', '/api?module=contract&action=getsourcecode&address=0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24', 200, scanNotFoundResponse)

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x1')).resolves.toBeUndefined()
  })

  it('retrieves an ABI from sourcify when the chain is unsupported for *scan lookup', async () => {
    mockApiResponse('sourcify.dev', '/server/files/any/4/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 200, sourcifyResponse)

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x4')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })
})
