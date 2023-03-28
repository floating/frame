import BigNumber from 'bignumber.js'

import { MAX_HEX } from '../constants'

export const max = BigNumber(MAX_HEX, 16)

const numberRegex = /\.0+$|(\.[0-9]*[1-9])0+$/

const digitsLookup = [
  { value: 1, symbol: '' },
  { value: 1e6, symbol: 'million' },
  { value: 1e9, symbol: 'billion' },
  { value: 1e12, symbol: 'trillion' },
  { value: 1e15, symbol: 'quadrillion' },
  { value: 1e18, symbol: 'quintillion' }
]

export function formatNumber(n: number, digits = 4) {
  const num = Number(n)
  const item = digitsLookup
    .slice()
    .reverse()
    .find((item) => num >= item.value) || { value: 0, symbol: '?' }

  const formatted = (value: number) => {
    const isAproximate = value.toFixed(digits) !== value.toString(10)
    const prefix = isAproximate ? '~' : ''
    return `${prefix}${value.toFixed(digits).replace(numberRegex, '$1')} ${item.symbol}`
  }

  return item ? formatted(num / item.value) : '0'
}

export function isUnlimited(amount: string) {
  return max.eq(amount)
}

export function formatDisplayDecimal(amount: string | number, decimals: number) {
  const bn = BigNumber(amount).shiftedBy(-decimals)

  if (bn.gt(9e12)) return decimals ? '~unlimited' : 'unknown'

  return formatNumber(bn.toNumber())
}
