import log from 'electron-log'
import nock from 'nock'

import { fetchSourcifyContract } from '../../../../main/contracts/sources/sourcify'

function mockApiResponse(
  domain,
  path,
  status,
  body,
  timeout = 0,
  headers = { 'content-type': 'application/json' }
) {
  nock(`https://${domain}`).get(path).delay(timeout).reply(status, body, headers)
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
    inputs: [{ internalType: 'uint256', name: 'num', type: 'uint256' }],
    name: 'store',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const sourcifyResponse = {
  status: 'partial',
  files: [
    {
      name: 'metadata.json',
      path: '',
      content: JSON.stringify({
        output: {
          abi: mockAbi,
          devdoc: { title: 'mock sourcify abi' }
        }
      })
    }
  ]
}

const sourcifyNotFoundResponse = {
  error: 'Files have not been found!'
}

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
  nock.disableNetConnect()
  log.transports.console.level = false
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  log.transports.console.level = 'debug'
})

afterEach(() => {
  nock.abortPendingRequests()
})

describe('#fetchSourcifyContract', () => {
  const contractAddress = '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'
  const domain = 'sourcify.dev'
  const endpoint = `/server/files/any/137/${contractAddress}`

  const mockSourcifyApi = (status, response, delay) => {
    mockApiResponse(domain, endpoint, status, response, delay)
  }

  it('retrieves a contract from sourcify', async () => {
    mockSourcifyApi(200, sourcifyResponse)

    return expect(fetchSourcifyContract(contractAddress, 137)).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi),
      name: 'mock sourcify abi',
      source: 'sourcify'
    })
  })

  it('does not retrieve a contract when the request fails', async () => {
    mockSourcifyApi(400)

    return expect(fetchSourcifyContract(contractAddress, 137)).resolves.toBeUndefined()
  })

  it('does not retrieve a contract when the contract is not found', async () => {
    mockSourcifyApi(200, sourcifyNotFoundResponse)

    return expect(fetchSourcifyContract(contractAddress, 137)).resolves.toBeUndefined()
  })

  it('does not retrieve a contract when the request times out', async () => {
    mockSourcifyApi(200, sourcifyResponse, 10000)

    const contract = expect(fetchSourcifyContract(contractAddress, 137)).resolves.toBeUndefined()

    jest.advanceTimersByTime(4000)

    return contract
  })
})
