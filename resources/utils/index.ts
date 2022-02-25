import { addHexPrefix, intToHex } from 'ethereumjs-util'

const weiToGwei = (wei: number) => wei / 1e9
const weiToHex = (wei: number) => addHexPrefix(wei.toString(16))
const gweiToWei = (gwei: number) => gwei * 1e9
const gweiToHex = (gwei: number) => weiToHex(gwei * 1e9)
const hexToInt = (hexStr: string) => parseInt(hexStr, 16)
const weiHexToGweiInt = (weiHex: string) => hexToInt(weiHex) / 1e9
const weiIntToEthInt = (wei: number) => wei / 1e18
const gweiToWeiHex = (gwei: number) => intToHex(gweiToWei(gwei))

function randomLetters (num: number) {
  return [...Array(num)].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('')
}

function capitalize (s: string) {
  return s[0].toUpperCase() + s.substring(1).toLowerCase()
}

function arraysEqual <T> (a: T[] = [], b: T[] = []) {
  if (a.length !== b.length) return false

  return arraysMatch(a.sort(), b.sort())
}

function arraysMatch <T> (a: T[] = [], b: T[] = []) {
  return (
    a.length === b.length &&
    a.every((elem, i) => b[i] === elem)
  )
}

export {
  randomLetters,
  capitalize,
  arraysEqual,
  arraysMatch,
  weiToGwei,
  weiToHex,
  gweiToWei,
  gweiToHex,
  intToHex,
  hexToInt,
  weiHexToGweiInt,
  weiIntToEthInt,
  gweiToWeiHex
}
