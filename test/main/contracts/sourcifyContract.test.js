import log from 'electron-log'
import nock from 'nock'

import { fetchSourcifyContract } from '../../../main/contracts/sourcifyContract'

function mockApiResponse (domain, path, status, body = sourcifyResponse, headers = { 'content-type': 'application/json' }) {
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

describe('#fetchSourcifyContract', () => {
  const contractAddress = '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'

  it('retrieves a contract from sourcify', async () => {
    mockApiResponse('sourcify.dev', `/server/files/any/137/${contractAddress}`, 200)

    return expect(fetchSourcifyContract(contractAddress, '0x89')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })

  it('does not retrieve a contract when the request fails', async () => {
    mockApiResponse('sourcify.dev', `/server/files/any/137/${contractAddress}`, 400)

    return expect(fetchSourcifyContract(contractAddress, '0x89')).resolves.toBeUndefined()
  })

  it('does not retrieve a contract when the contract is not found', async () => {
    mockApiResponse('sourcify.dev', `/server/files/any/137/${contractAddress}`, 200, sourcifyNotFoundResponse)

    return expect(fetchSourcifyContract(contractAddress, '0x89')).resolves.toBeUndefined()
  })
})
