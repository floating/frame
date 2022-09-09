import log from 'electron-log'
import { Interface } from '@ethersproject/abi'
import { fetchSourcifyContract } from './sourcifyContract'
import { chainSupported, fetchEtherscanContract } from './etherscanContract'

export interface ContractSource {
  abi: string,
  name: string,
  source: string
}

export interface DecodedCallData {
  contractAddress: string,
  contractName: string,
  source: string,
  method: string,
  args: Array<{
    name: string,
    type: string,
    value: string
  }>
}

function parseAbi (abiData: string): Interface | undefined {
  try {
    return new Interface(abiData)
  } catch (e) {
    log.warn(`could not parse ABI data: ${abiData}`)
  }
}

export async function fetchContract (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
  try {
    const [sourcifyContract, scanContract] = await Promise.all([fetchSourcifyContract(contractAddress, chainId), fetchEtherscanContract(contractAddress, chainId)])
    
    // if no scan result and scan supports the chain, return undefined
    if (scanContract && scanContract.abi === 'Contract source code not verified' && chainSupported(chainId)) {
      return undefined
    }    
    
    return sourcifyContract || scanContract
  } catch (e) {
    log.warn(`could not fetch source code for contract ${contractAddress}`, e)
  }
}

export function decodeCallData (calldata: string, abi: string) {
  const contractInterface = parseAbi(abi)

  if (contractInterface) {
    const sighash = calldata.slice(0, 10)

    try {
      const abiMethod = contractInterface.getFunction(sighash)
      const decoded = contractInterface.decodeFunctionData(sighash, calldata)

      return {
        method: abiMethod.name,
        args: abiMethod.inputs.map((input, i) => ({ name: input.name, type: input.type, value: decoded[i].toString() }))
      }
    } catch (e) {
      log.warn('unknown ABI method for signature', sighash)
    }
  }
}

