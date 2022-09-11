import { fetchContract } from '../../../main/contracts'
import { fetchSourcifyContract } from '../../../main/contracts/sourcifyContract'
import { fetchEtherscanContract } from '../../../main/contracts/etherscanContract'

jest.mock('../../../main/contracts/sourcifyContract')
jest.mock('../../../main/contracts/etherscanContract')

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

describe('#fetchContract', () => {
  it('retrieves a contract from sourcify when etherscan returns no contract', () => {
    fetchSourcifyContract.mockResolvedValue({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
    fetchEtherscanContract.mockRejectedValue('b0rk')

    return expect(fetchContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '1')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock sourcify abi', 
      source: 'sourcify'
    })
  })

  it(`retrieves a contract from etherscan when sourcify returns no contract`, () => {
    fetchSourcifyContract.mockRejectedValue('b0rk')
    fetchEtherscanContract.mockResolvedValue({
      abi: JSON.stringify(mockAbi), 
      name: 'mock etherscan abi', 
      source: 'etherscan'
    })

    return expect(fetchContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '1')).resolves.toStrictEqual({
      abi: JSON.stringify(mockAbi), 
      name: 'mock etherscan abi', 
      source: 'etherscan'
    })
  })

  it(`does not retrieve a contract when no contracts are available from any sources`, () => {
    fetchSourcifyContract.mockRejectedValue('b0rk')
    fetchEtherscanContract.mockRejectedValue('b0rk')

    return expect(fetchContract('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '1')).resolves.toBeUndefined()
  })
})
