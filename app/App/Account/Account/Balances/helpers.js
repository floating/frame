import BigNumber from 'bignumber.js'
import { NATIVE_CURRENCY } from '../../../../../resources/constants'

const UNKNOWN = '?'

export function formatBalance (balance, totalValue, decimals = 8) {
  const isZero = balance.isZero()
  if (!isZero && balance.toNumber() < 0.001 && totalValue.toNumber() < 1) return '<0.001'

  return new Intl.NumberFormat('us-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(balance.toFixed(decimals, BigNumber.ROUND_FLOOR))
}

export function formatUsdRate (rate, decimals = 2) {
  return rate.isNaN()
    ? UNKNOWN
    : new Intl.NumberFormat('us-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(rate.toFixed(decimals, BigNumber.ROUND_FLOOR))
}

export function balance (rawBalance, quote = {}) {
  const balance = BigNumber(rawBalance.balance || 0).shiftedBy(-rawBalance.decimals)
  const usdRate = BigNumber(quote.price)
  const totalValue = balance.times(usdRate)
  const balanceDecimals = Math.max(2, usdRate.shiftedBy(1).toFixed(0, BigNumber.ROUND_DOWN).length)

  return {
    ...rawBalance,
    displayBalance: formatBalance(balance, totalValue, balanceDecimals),
    price: formatUsdRate(usdRate),
    priceChange: !usdRate.isZero() && !usdRate.isNaN() && BigNumber(quote['change24hr'] || 0).toFixed(2),
    totalValue: totalValue.isNaN() ? BigNumber(0) : totalValue,
    displayValue: totalValue.isZero() ? '0' : formatUsdRate(totalValue, 0)
  }
}

export function isNativeCurrency (address) {
  return address === NATIVE_CURRENCY
}
