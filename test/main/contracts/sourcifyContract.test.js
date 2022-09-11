import log from 'electron-log'
import nock from 'nock'

import { fetchSourcifyContract } from '../../../main/contracts/sourcifyContract'

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

const sourcifyNotFoundResponse = {
  error: 'Files have not been found!'
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

const mockSourcify = (address) => [
  {
    chainName: 'mainnet',
    chainId: '0x1',
    sourcifyEndpoint: `/server/files/any/1/${address}`
  },
  {
    chainName: 'polygon',
    chainId: '0x89',
    sourcifyEndpoint: `/server/files/any/137/${address}`
  },
  {
    chainName: 'optimism',
    chainId: '0xa',
    sourcifyEndpoint: `/server/files/any/10/${address}`
  },
  {
    chainName: 'arbitrum',
    chainId: '0xa4b1',
    sourcifyEndpoint: `/server/files/any/42161/${address}`
  }
]

describe('#fetchSourcifyContract', () => {
  mockSourcify('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0').forEach(({ chainName, chainId, sourcifyEndpoint }) => {
    describe(`querying ${chainName}`, () => {
      it('retrieves a contract from sourcify', () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 200, sourcifyResponse)
    
        return expect(fetchSourcifyContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).resolves.toStrictEqual({
          abi: JSON.stringify(mockAbi), 
          name: 'mock sourcify abi', 
          source: 'sourcify'
        })
      })
    
      it('does not retrieve a contract when the request fails', () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 400)
    
        return expect(fetchSourcifyContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).rejects.toBe('Contract 0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0 not found in Sourcify')
      })

      it('does not retrieve a contract when the contract is not found', () => {
        mockApiResponse('sourcify.dev', sourcifyEndpoint, 200, sourcifyNotFoundResponse)
    
        return expect(fetchSourcifyContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', chainId)).rejects.toBe('Contract 0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0 not found in Sourcify')
      })
    })
  })
})
