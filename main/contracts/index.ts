import log from 'electron-log'
import { Interface } from '@ethersproject/abi'
import { fetchSourcifyContract } from './sources/sourcify'
import { fetchEtherscanContract } from './sources/etherscan'
import { defaultAbiCoder } from '@ethersproject/abi'
import functionSignatures from "./functionSignatures"

// this list should be in order of descending priority as each source will
// be searched in turn
const fetchSources = [
  fetchSourcifyContract,
  fetchEtherscanContract
]

type ContractSourceResult = ContractSource | undefined

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

function splitUpSignature (signature: string): [string, string[]] {
  const firstBracket = signature.indexOf('(')
  const secondBracket = signature.indexOf(')')
  if (firstBracket < 0 || secondBracket < 0 ) {
    throw new Error('Unable to locate the brackets')
  }
  const functionName = signature.slice(0, firstBracket)
  const inputTypes = signature.slice(firstBracket+1, secondBracket).split(',')
  return [functionName, inputTypes]
}

function decode(inputData: string, inputTypes: string[]) {
  return defaultAbiCoder.decode(inputTypes, `0x${inputData.slice(10)}`)
}

export function decodeCallDataUsingDictionary (calldata: string) {

  const sighash = calldata.slice(0, 10)
  //@ts-ignore
  const signatures = functionSignatures.functions[sighash]
  if(!signatures?.length || signatures.length > 1) {
    log.warn('function dictionary does not contain a direct match for this function selector: ', sighash)
    return
  }
  //TODO: filter out impossible types and maybe we can handle cases where more than a single result for a function in dictionary...
  const [functionName, inputTypes] = splitUpSignature(signatures[0])
  const decodedInput = decode(calldata, inputTypes)
  return {
    method: functionName,
    args: decodedInput.map((input, i) => ({ name: '', type: inputTypes[i], value: input.toString() }))
  }
}

export async function fetchContract (contractAddress: Address, chainId: number): Promise<ContractSourceResult> {
  const fetches = fetchSources.map((getContract) => getContract(contractAddress, chainId))

  let contract: ContractSourceResult = undefined
  let i = 0

  while (!contract && i < fetches.length) {
    log.info({i})
    contract = await fetches[i]
    log.info({contract, bool: !contract})
    i += 1
  }
  
  if (!contract) {
    log.warn(`could not fetch source code for contract ${contractAddress}`)
  }

  return contract
}
