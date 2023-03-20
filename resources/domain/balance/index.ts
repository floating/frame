import BigNumber from 'bignumber.js'

import { NATIVE_CURRENCY } from '../../constants'

import type { WithTokenId, Balance, Rate } from '../../../main/store/state'

interface DisplayedBalance extends Balance {
  displayBalance: string
  price: string
  priceChange: string | false
  usdRate: Rate
  totalValue: BigNumber
  displayValue: string
}

const UNKNOWN = '?'

export function formatBalance(balance: BigNumber, totalValue: BigNumber, decimals = 8) {
  const isZero = balance.isZero()
  if (!isZero && balance.toNumber() < 0.001 && totalValue.toNumber() < 1) return '<0.001'

  return new Intl.NumberFormat('us-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(Number(balance.toFixed(decimals, BigNumber.ROUND_FLOOR)))
}

export function formatUsdRate(rate: BigNumber, decimals = 2) {
  return rate.isNaN()
    ? UNKNOWN
    : new Intl.NumberFormat('us-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(Number(rate.toFixed(decimals, BigNumber.ROUND_FLOOR)))
}

export function createBalance(rawBalance: Balance, quote?: Rate): DisplayedBalance {
  const balance = BigNumber(rawBalance.balance || 0).shiftedBy(-rawBalance.decimals)
  const usdRate = new BigNumber((quote && quote.price) || NaN)
  const change24hr = new BigNumber((quote && quote['change24hr']) || 0)

  const totalValue = balance.times(usdRate)
  const balanceDecimals = Math.max(2, usdRate.shiftedBy(1).toFixed(0, BigNumber.ROUND_DOWN).length)

  return {
    ...rawBalance,
    usdRate: quote as Rate,
    displayBalance: formatBalance(balance, totalValue, balanceDecimals),
    price: formatUsdRate(usdRate),
    priceChange: !usdRate.isZero() && !usdRate.isNaN() && change24hr.toFixed(2),
    totalValue: totalValue.isNaN() ? BigNumber(0) : totalValue,
    displayValue: totalValue.isZero() ? '0' : formatUsdRate(totalValue, 0)
  }
}

export const sortByTotalValue = (a: DisplayedBalance, b: DisplayedBalance) => {
  const difference = b.totalValue.minus(a.totalValue)
  if (!difference.isZero()) {
    return difference
  }
  const balanceA = BigNumber(a.balance || 0).shiftedBy(-a.decimals)
  const balanceB = BigNumber(b.balance || 0).shiftedBy(-b.decimals)

  return balanceB.minus(balanceA)
}

export function isNativeCurrency(address: string) {
  return address === NATIVE_CURRENCY
}

export function toTokenId(token: WithTokenId) {
  const { chainId, address } = token
  return `${chainId}:${address.toLowerCase()}`
}
