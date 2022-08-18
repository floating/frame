// Reveal details about pending transactions

import log from 'electron-log'
// @ts-ignore
import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'
import nebulaApi from '../nebula'

import Erc20Contract from '../contracts/erc20'
import { decodeContractCall } from '../contracts'

const nebula = nebulaApi()
const provider = new EthereumProvider(proxyConnection)

// TODO: Discuss the need to set chain for the proxy connection
provider.setChain('0x1')

type EntityType = 'external' | 'contract' | 'unknown'

async function resolveEntityType (address: string, chainId: string): Promise<EntityType> {
  if (!address || !chainId) return 'unknown'
  try {
    const payload: JSONRPCRequestPayload = {
      method: 'eth_getCode',
      params: [address, 'latest'],
      jsonrpc: '2.0',
      id: 1,
      chainId // TODO: Verify this overrides setChain
    }      
    const code = (await provider.request(payload) || [])
    const type = (code === '0x' || code === '0x0') ? 'external' : 'contract'
    return type
  } catch (e) {
    log.error(e)
    return 'unknown'
  }
}

async function resolveEnsName (address: string): Promise<string> {
  try {
    const ensName: string = (await nebula.ens.reverseLookup([address]) || [])[0]
    return ensName
  } catch (e) {
    log.warn(e)
    return ''
  }
}

type Actions = Array<{
  type: string
  data: {}
}>

async function recogErc20 (actions: Actions, contractAddress: string, chainId: string, calldata: string) {
  if (!contractAddress) return
  try {
    const contract = new Erc20Contract(contractAddress, chainId)
    const decoded = contract.decodeCallData(calldata)
    if (decoded) {
      const { decimals, name, symbol } = await contract.getTokenData()
      if (Erc20Contract.isApproval(decoded)) {
        const spender = decoded.args[0].toLowerCase()
        const amount = decoded.args[1].toHexString()
        const { ens, type } = await surface.identity(spender, chainId)
        actions.push({
          type: 'erc20:approval',
          data: { spender, amount, decimals, name, symbol, spenderEns: ens, spenderType: type }
        })
      } else if (Erc20Contract.isTransfer(decoded)) {
        const recipient = decoded.args[0].toLowerCase()
        const amount = decoded.args[1].toHexString()
        const { ens, type } = await surface.identity(recipient, chainId)
        actions.push({ 
          type: 'erc20:transfer',
          data: { recipient, amount, decimals, name, symbol, recipientEns: ens, recipientType: type }
        })
      }
    }
  } catch (e) {
    log.warn(e)
  }
}

const surface = {
  identity: async (address: string, chainId: string) => {
    // Resolve ens, type and other data about address entities 
    const results = await Promise.all([
      resolveEntityType(address, chainId),
      resolveEnsName(address)
    ])
    // TODO: Check the address against various scam dbs
    // TODO: Check the address against user's contact list
    // TODO: Check the address against previously verified contracts
    const identityResults = {
      type: results[0],
      ens: results[1]
    }
    console.log('identityResults', identityResults)
    return identityResults
  },
  decode: async (contractAddress: string, chainId: string, calldata: string) => {
    // Decode calldata
    const decodedCalldata = await decodeContractCall(contractAddress || '', chainId, calldata)
    return decodedCalldata
  },
  recog: async (contractAddress: string, chainId: string, calldata: string) => {
    // Recognize actions from standard tx types
    const actions: Actions = []
    await recogErc20(actions, contractAddress, chainId, calldata)
    return actions
  },
  simulate: async () => {}
}

export default surface
