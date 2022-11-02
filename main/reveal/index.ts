// Reveal details about pending transactions

import log from 'electron-log'
import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'
import nebulaApi from '../nebula'

import Erc20Contract from '../contracts/erc20'
import { decodeCallData, fetchContract, ContractSource } from '../contracts'
import ensContracts from '../contracts/deployments/ens'
import erc20 from '../externalData/balances/erc-20-abi'

import { addHexPrefix } from 'ethereumjs-util'

const knownContracts: Contract[] = [
  ...ensContracts
]

const erc20Abi = JSON.stringify(erc20)

const nebula = nebulaApi()
const provider = new EthereumProvider(proxyConnection)

// TODO: Discuss the need to set chain for the proxy connection
provider.setChain('0x1')

// TODO: put these types in a standard actions location
export type ActionType =
  'erc20:approval' |
  'erc20:transfer' |
  'ens:commit' |
  'ens:register' |
  'ens:renew' |
  'ens:transfer' |
  'ens:approve'

export type Action = {
  id: ActionType
  data?: any
}

type Actions = Array<Action>

type EntityType = 'external' | 'contract' | 'unknown'
export interface Contract {
  name: string
  address: Address
  chainId: number
  decode: DecodeFunction
}

type RecognitionContext = {
  contractAddress: string
  chainId: number
  account?: string
}

type DecodeContext = {
  account?: Address
}
type DecodeFunction = (calldata: string, context?: DecodeContext) => Action | undefined

async function resolveEntityType (address: string, chainId: number): Promise<EntityType> {
  if (!address || !chainId) return 'unknown'
  try {
    const payload: JSONRPCRequestPayload = {
      method: 'eth_getCode',
      params: [address, 'latest'],
      jsonrpc: '2.0',
      id: 1,
      chainId: addHexPrefix(chainId.toString(16)) // TODO: Verify this overrides setChain
    }

    const code = await provider.request(payload)
    const type = (code === '0x' || code === '0x0') ? 'external' : 'contract'
    return type
  } catch (e) {
    log.error(e)
    return 'unknown'
  }
}

async function resolveEnsName (address: string): Promise<string> {
  try {
    const ensName: string = (await nebula.ens.reverseLookup([address]))[0]
    return ensName
  } catch (e) {
    log.warn(e)
    return ''
  }
}

async function recogErc20 (contractAddress: string, chainId: number, calldata: string): Promise<Action | undefined> {
  if (contractAddress) {
    try {
      const contract = new Erc20Contract(contractAddress, chainId)
      const decoded = contract.decodeCallData(calldata)
      if (decoded) {
        const { decimals, name, symbol } = await contract.getTokenData()
        if (Erc20Contract.isApproval(decoded)) {
          const spender = decoded.args[0].toLowerCase()
          const amount = decoded.args[1].toHexString()
          const { ens, type } = await surface.identity(spender, chainId)
          return {
            id: 'erc20:approval',
            data: { spender, amount, decimals, name, symbol, spenderEns: ens, spenderType: type }
          }
        } else if (Erc20Contract.isTransfer(decoded)) {
          const recipient = decoded.args[0].toLowerCase()
          const amount = decoded.args[1].toHexString()
          const { ens, type } = await surface.identity(recipient, chainId)
          return { 
            id: 'erc20:transfer',
            data: { recipient, amount, decimals, name, symbol, recipientEns: ens, recipientType: type }
          }
        }
      }
    } catch (e) {
      log.warn(e)
    }
  }
}

function identifyKnownContractActions (calldata: string, context: RecognitionContext): Action | undefined {
  const knownContract = knownContracts.find(contract =>
    contract.address.toLowerCase() === context.contractAddress.toLowerCase() && contract.chainId === context.chainId)

  if (knownContract) {
    try {
      return knownContract.decode(calldata, context)
    } catch (e) {
      log.warn('Could not decode known contract action', { calldata, context }, e)
    }
  }
}

const surface = {
  identity: async (address: string = '', chainId: number) => {
    // Resolve ens, type and other data about address entities 
    const [type, ens] = await Promise.all([
      resolveEntityType(address, chainId),
      resolveEnsName(address)
    ])
    // TODO: Check the address against various scam dbs
    // TODO: Check the address against user's contact list
    // TODO: Check the address against previously verified contracts
    return { type, ens }
  },
  decode: async (contractAddress: string = '', chainId: number, calldata: string) => {
    // Decode calldata
    const contractSources: ContractSource[] = [{ name: 'ERC-20', source: 'Generic ERC-20', abi: erc20Abi }]
    const contractSource = await fetchContract(contractAddress, chainId)
  
    if (contractSource) {
      contractSources.push(contractSource)
    }
  
    for (const { name, source, abi } of contractSources.reverse()) {
      const decodedCall = decodeCallData(calldata, abi)
  
      if (decodedCall) {
        return {
          contractAddress: contractAddress.toLowerCase(),
          contractName: name,
          source,
          ...decodedCall
        }
      }
    }
  
    log.warn(`Unable to decode data for contract ${contractAddress}`)
  },
  recog: async (calldata: string, context: RecognitionContext) => {
    // Recognize actions from standard tx types
    const actions = ([] as Actions).concat(
      await recogErc20(context.contractAddress, context.chainId, calldata) || [],
      identifyKnownContractActions(calldata, context) || []
    )

    return actions
  },
  simulate: async () => {}
}

export default surface
