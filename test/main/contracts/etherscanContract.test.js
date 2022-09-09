import log from 'electron-log'
import nock from 'nock'

import { fetchEtherscanContract } from '../../../main/contracts/etherscanContract'

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

const etherscanResponse = {
    message: 'OK',
    result: [{
      ABI: JSON.stringify(mockAbi),
      ContractName: 'mock etherscan abi'
    }]
  }
  
const etherscanNotFoundResponse = {
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

const mockEtherscan = (address) => [
  {
    chainName: 'mainnet',
    chainId: '0x1',
    etherscanName: 'etherscan', 
    etherscanDomain: 'api.etherscan.io', 
    etherscanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
  },
  {
    chainName: 'polygon',
    chainId: '0x89',
    etherscanName: 'polygonscan', 
    etherscanDomain: 'api.polygonscan.com', 
    etherscanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=2P3U9T63MT26T1X64AAE368UNTS9RKEEBB`,
  },
  {
    chainName: 'optimism',
    chainId: '0xa',
    etherscanName: 'optimistic.etherscan', 
    etherscanDomain: 'api-optimistic.etherscan.io', 
    etherscanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
  },
  {
    chainName: 'arbitrum',
    chainId: '0xa4b1',
    etherscanName: 'arbiscan', 
    etherscanDomain: 'api.arbiscan.io', 
    etherscanEndpoint: `/api?module=contract&action=getsourcecode&address=${address}&apikey=VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD`,
  }
]

describe('#fetchEtherscanContract', () => {
  mockEtherscan('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0').forEach(({ chainName, chainId, etherscanName, etherscanDomain, etherscanEndpoint }) => {
    describe(`querying ${chainName}`, () => {
      it(`retrieves a contract from ${etherscanName}`, () => {
        mockApiResponse(etherscanDomain, etherscanEndpoint, 200, etherscanResponse)
    
        return expect(fetchEtherscanContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toStrictEqual({
          abi: JSON.stringify(mockAbi), 
          name: 'mock etherscan abi', 
          source: etherscanName
        })
      })
    
      it(`does not retrieve a contract from ${etherscanName} when the request fails`, () => {
        mockApiResponse(etherscanDomain, etherscanEndpoint, 400, etherscanResponse)
    
        return expect(fetchEtherscanContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toBeUndefined()
      })

      it(`does not retrieve a contract from ${etherscanName} when the contract is not found`, () => {
        mockApiResponse(etherscanDomain, etherscanEndpoint, 200, etherscanNotFoundResponse)
    
        return expect(fetchEtherscanContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toBeUndefined()
      })
    })
  })
})
