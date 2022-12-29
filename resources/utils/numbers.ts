import { BigNumber } from 'bignumber.js'

import { MAX_HEX } from '../constants'

const numberRegex = /\.0+$|(\.[0-9]*[1-9])0+$/

const digitsLookup = [
  { value: 1, symbol: '' },
  { value: 1e6, symbol: 'million' },
  { value: 1e9, symbol: 'billion' },
  { value: 1e12, symbol: 'trillion' },
  { value: 1e15, symbol: 'quadrillion' },
  { value: 1e18, symbol: 'quintillion' }
]

export function formatNumber(n: number, digits = 2) {
  const num = Number(n)
  const item = digitsLookup
    .slice()
    .reverse()
    .find((item) => num >= item.value) || { value: 0, symbol: '?' }
  const formatted = (value: number) => `${value.toFixed(digits).replace(numberRegex, '$1')} ${item.symbol}`

  return item ? formatted(num / item.value) : '0'
}

export function isUnlimited(amount: string) {
  return amount === MAX_HEX
}

export function formatDisplayInteger(amount: number, decimals: number) {
  const displayInt = new BigNumber(amount).shiftedBy(-decimals).integerValue().toNumber()

  if (displayInt > 9e12) {
    return decimals ? '~unlimited' : 'unknown'
  }

  return formatNumber(displayInt)
}
