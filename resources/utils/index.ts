import { randomInt } from 'crypto'
import { addHexPrefix, intToHex, stripHexPrefix } from '@ethereumjs/util'

const weiToGwei = (wei: number) => wei / 1e9
const weiToHex = (wei: number) => addHexPrefix(wei.toString(16))
const gweiToWei = (gwei: number) => gwei * 1e9
const gweiToHex = (gwei: number) => weiToHex(gwei * 1e9)
const hexToInt = (hexStr: string) => parseInt(hexStr, 16)
const weiHexToGweiInt = (weiHex: string) => hexToInt(weiHex) / 1e9
const weiIntToEthInt = (wei: number) => wei / 1e18
const gweiToWeiHex = (gwei: number) => intToHex(gweiToWei(gwei))

function randomLetters (num: number) {
  return [...Array(num)].map(() => String.fromCharCode(65 + randomInt(0, 26))).join('')
}

function capitalize (s: string) {
  if (!s) return s
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

function debounce (func: (...args: any) => any, timeout = 300) {
  let timer: NodeJS.Timeout

  return (...args: any) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

function instanceOfNodeError<T extends ErrorConstructor> (
  value: Error,
  errorType: T
): value is InstanceType<T> & NodeJS.ErrnoException {
  return value instanceof errorType;
}

function getErrorCode (e: Error) {
  if (!instanceOfNodeError(e, Error)) {
    return undefined
  }

  return e.code
}

const matchFilter = (filter: string = '', properties: string[] = []) => {
  if (!filter) return true
  if (typeof filter !== 'string' || !Array.isArray(properties)) return false
  const filterItems = filter.split(' ')
  return filterItems.every((item = '') => {
    item = item.toLowerCase()
    return properties.some(prop => {
      prop = prop.toLowerCase()
      return prop.indexOf(item) !== -1
    })
  })
}

export {
  getErrorCode,
  randomLetters,
  capitalize,
  arraysEqual,
  arraysMatch,
  debounce,
  weiToGwei,
  weiToHex,
  gweiToWei,
  gweiToHex,
  intToHex,
  hexToInt,
  weiHexToGweiInt,
  weiIntToEthInt,
  gweiToWeiHex,
  stripHexPrefix,
  matchFilter
}
