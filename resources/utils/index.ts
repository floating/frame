import { addHexPrefix, intToHex } from 'ethereumjs-util'

const weiToGwei = (wei: number) => wei / 1e9
const weiToHex = (wei: number) => addHexPrefix(wei.toString(16))
const gweiToWei = (gwei: number) => gwei * 1e9
const gweiToHex = (gwei: number) => weiToHex(gwei * 1e9)
const hexToInt = (hexStr: string) => parseInt(hexStr, 16)
const weiHexToGweiInt = (weiHex: string) => hexToInt(weiHex) / 1e9
const gweiToWeiHex = (gwei: number) => intToHex(gweiToWei(gwei))

function randomLetters (num: number) {
  return [...Array(num)].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('')
}

function capitalize (s: string) {
  return s[0].toUpperCase() + s.substring(1).toLowerCase()
}

function arraysMatch (a: number[] = [], b: number[] = []) {
  return (
    a.length === b.length &&
    a.every((chainId, i) => b[i] === chainId)
  )
}

export {
  randomLetters,
  capitalize,
  arraysMatch,
  weiToGwei,
  weiToHex,
  gweiToWei,
  gweiToHex,
  intToHex,
  hexToInt,
  weiHexToGweiInt,
  gweiToWeiHex
}
