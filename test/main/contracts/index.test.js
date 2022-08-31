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

const mockScan = (address) => [
  {
    chainName: 'mainnet',
    chainId: '0x1',
    scanName: 'etherscan', 
    scanDomain: 'api.etherscan.io', 
    scanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
    sourcifyEndpoint: `/server/files/any/1/${address}`
  },
  {
    chainName: 'polygon',
    chainId: '0x89',
    scanName: 'polygonscan', 
    scanDomain: 'api.polygonscan.com', 
    scanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=2P3U9T63MT26T1X64AAE368UNTS9RKEEBB`,
    sourcifyEndpoint: `/server/files/any/137/${address}`
  },
  {
    chainName: 'optimism',
    chainId: '0xa',
    scanName: 'optimistic.etherscan', 
    scanDomain: 'api-optimistic.etherscan.io', 
    scanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
    sourcifyEndpoint: `/server/files/any/10/${address}`
  },
  {
    chainName: 'arbitrum',
    chainId: '0xa4b1',
    scanName: 'arbiscan', 
    scanDomain: 'api.arbiscan.io', 
    scanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD`,
    sourcifyEndpoint: `/server/files/any/42161/${address}`
  }
]

describe('#fetchAbi', () => {
  mockScan('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0').forEach(({ chainName, chainId, scanName, scanDomain, scanEndpoint, sourcifyEndpoint }) => {
    describe(`querying ${chainName}`, () => {
      it('retrieves an ABI from sourcify by default', () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 200, sourcifyResponse)
        mockApiResponse(scanDomain, scanEndpoint, 200, scanResponse)
    
        return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toStrictEqual({
          abi: JSON.stringify(mockAbi), 
          name: 'mock sourcify abi', 
          source: 'sourcify'
        })
      })

      it(`retrieves an ABI from ${scanName} when the sourcify request fails`, () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 400, '')
        mockApiResponse(scanDomain, scanEndpoint, 200, scanResponse)
    
        return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toStrictEqual({
          abi: JSON.stringify(mockAbi), 
          name: 'mock scan abi', 
          source: scanName
        })
      })

      it(`retrieves an ABI from sourcify when the ${scanName} request fails`, () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 200, sourcifyResponse)
        mockApiResponse(scanDomain, scanEndpoint, 400, '')
    
        return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toStrictEqual({
          abi: JSON.stringify(mockAbi), 
          name: 'mock sourcify abi', 
          source: 'sourcify'
        })
      })
    
      it(`does not retrieve an ABI when it is not found via ${scanName}`, () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 200, sourcifyResponse)
        mockApiResponse(scanDomain, scanEndpoint, 200, scanNotFoundResponse)
    
        return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toBeUndefined()
      })
    })
  })

  it('retrieves an ABI from sourcify when the chain is unsupported for *scan lookup', () => {
    mockApiResponse('sourcify.dev', '/server/files/any/4/0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', 200, sourcifyResponse)

    return expect(fetchAbi('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x4')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })
})
