// Reveal details about pending transactions

import log from 'electron-log'
import EthereumProvider from 'ethereum-provider'
import { addHexPrefix } from '@ethereumjs/util'
import BigNumber from 'bignumber.js'

import proxyConnection from '../provider/proxy'
import nebulaApi from '../nebula'

import Erc20Contract from '../contracts/erc20'
import { decodeCallData, fetchContract, ContractSource } from '../contracts'
import ensContracts from '../contracts/deployments/ens'
import erc20 from '../externalData/balances/erc-20-abi'
import { MAX_HEX } from '../../resources/constants'

import type {
  ApproveAction as Erc20Approval,
  TransferAction as Erc20Transfer
} from '../transaction/actions/erc20'
import type { Action, DecodableContract, EntityType } from '../transaction/actions'
import type { TransactionRequest } from '../accounts'

// TODO: fix generic typing here
const knownContracts: DecodableContract<unknown>[] = [...ensContracts]

const erc20Abi = JSON.stringify(erc20)

const nebula = nebulaApi()
const provider = new EthereumProvider(proxyConnection)

// TODO: Discuss the need to set chain for the proxy connection
provider.setChain('0x1')

type RecognitionContext = {
  contractAddress: string
  chainId: number
  account?: string
}

async function resolveEntityType(address: string, chainId: number): Promise<EntityType> {
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
    const type = code === '0x' || code === '0x0' ? 'external' : 'contract'
    return type
  } catch (e) {
    log.error(e)
    return 'unknown'
  }
}

async function resolveEnsName(address: string): Promise<string> {
  try {
    const ensName: string = (await nebula.ens.reverseLookup([address]))[0]
    return ensName
  } catch (e) {
    log.warn(e)
    return ''
  }
}

async function getEnsNameDictionary(addresses: string[]) {
  const domains = await Promise.all(addresses.map(resolveEnsName))
  const dict: Record<string, string> = {}
  addresses.forEach((address, idx) => {
    dict[address] = domains[idx]
  })

  return dict
}

async function recogErc20(
  contractAddress: string,
  chainId: number,
  calldata: string
): Promise<Action<unknown> | undefined> {
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
          const data = {
            spender,
            amount,
            decimals,
            name,
            symbol,
            spenderEns: ens,
            spenderType: type,
            contract: contractAddress
          }

          return {
            id: 'erc20:approve',
            data,
            update: (request, { amount }) => {
              // amount is a hex string
              const approvedAmount = new BigNumber(amount || '').toString()

              log.verbose(
                `Updating Erc20 approve amount to ${approvedAmount} for contract ${contractAddress} and spender ${spender}`
              )

              const txRequest = request as TransactionRequest

              data.amount = amount
              txRequest.data.data = contract.encodeCallData('approve', [spender, amount])

              if (txRequest.decodedData) {
                txRequest.decodedData.args[1].value = amount === MAX_HEX ? 'unlimited' : approvedAmount
              }
            }
          } as Erc20Approval
        } else if (Erc20Contract.isTransfer(decoded)) {
          const recipient = decoded.args[0].toLowerCase()
          const amount = decoded.args[1].toHexString()
          const { ens, type } = await surface.identity(recipient, chainId)
          return {
            id: 'erc20:transfer',
            data: { recipient, amount, decimals, name, symbol, recipientEns: ens, recipientType: type }
          } as Erc20Transfer
        }
      }
    } catch (e) {
      log.warn(e)
    }
  }
}

function identifyKnownContractActions(
  calldata: string,
  context: RecognitionContext
): Action<unknown> | undefined {
  const knownContract = knownContracts.find(
    (contract) =>
      contract.address.toLowerCase() === context.contractAddress.toLowerCase() &&
      contract.chainId === context.chainId
  )

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
    const [type, ens] = await Promise.all([resolveEntityType(address, chainId), resolveEnsName(address)])
    // TODO: Check the address against various scam dbs
    // TODO: Check the address against user's contact list
    // TODO: Check the address against previously verified contracts
    return { type, ens }
  },
  getEnsNameDictionary,
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
    const actions = ([] as Action<unknown>[]).concat(
      (await recogErc20(context.contractAddress, context.chainId, calldata)) || [],
      identifyKnownContractActions(calldata, context) || []
    )

    return actions
  },
  simulate: async () => {}
}

export default surface
