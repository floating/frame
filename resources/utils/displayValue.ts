import BigNumber from 'bignumber.js'
import { isHexString } from 'ethers/lib/utils'

const displayUnitMapping = {
  thousand: {
    lowerBound: BigNumber(999),
    upperBound: BigNumber(999999),
    unitDisplay: 'k'
  },
  million: {
    lowerBound: BigNumber(999999),
    upperBound: BigNumber(999999999),
    unitDisplay: 'M'
  },
  billion: {
    lowerBound: BigNumber(999999999),
    upperBound: BigNumber(999999999999),
    unitDisplay: 'Bn'
  },
  trillion: {
    lowerBound: BigNumber(999999999999),
    upperBound: BigNumber(999999999999999),
    unitDisplay: 'Tn'
  },
  quadrillion: {
    lowerBound: BigNumber(999999999999999),
    upperBound: BigNumber(Infinity),
    unitDisplay: 'Qn'
  }
}

function getDisplayValue (bn: BigNumber) {
  // large numbers
  for (const [unitName, { lowerBound, upperBound, unitDisplay }] of Object.entries(displayUnitMapping)) {
    if (bn.isGreaterThan(lowerBound) && bn.isLessThan(upperBound)) {
      return {
        displayValue: bn.shiftedBy(-(lowerBound.sd(true))).sd(3).toFormat(),
        displayUnit: {
          fullName: unitName,
          shortName: unitDisplay
        }
      }
    }
  }

  // small numbers < 1000
  return {
    displayValue: bn.toFormat()
  }
}

type DisplayValueDataParams = { 
  currencyRate?: Rate, 
  decimals: number, 
  decimalsOverride?: number, 
  isTestnet: boolean 
}

type Currency = { 
  value: BigNumber, 
  displayValue: string, 
  approximationSymbol?: string 
}

type SourceValue = string | number | BigNumber

export function displayValueData (sourceValue: SourceValue, params: DisplayValueDataParams) {
  const { currencyRate, decimals = 18, decimalsOverride, isTestnet = false } = params || {} as DisplayValueDataParams
  const bn = BigNumber(sourceValue, isHexString(sourceValue) ? 16 : undefined)
  const currency: { [K: string]: Currency } = {}

  const getFiatCurrency = (): Currency => {  
    const nativeCurrency = BigNumber(isTestnet || !currencyRate ? 0 : currencyRate.price)
    const value = bn.shiftedBy(-18).multipliedBy(nativeCurrency).decimalPlaces(2, BigNumber.ROUND_FLOOR)
    
    if (isTestnet) {
      return {
        value, 
        displayValue: '?'
      }
    }

    if (value.isZero()) {
      return {
        value,
        approximationSymbol: '<',
        displayValue: '0.01'
      }
    }  
  
    return {
      value,
      ...getDisplayValue(value)
    }
  }

  currency.fiat = getFiatCurrency()

  const getEtherCurrency = () => {
    const value = bn.shiftedBy(-decimals).decimalPlaces(decimalsOverride || decimals, BigNumber.ROUND_FLOOR)
  
    if (decimalsOverride && value.isZero()) {
      return {
        value,
        approximationSymbol: '<',
        displayValue: BigNumber(`1e-${decimalsOverride}`).toFormat()
      }
    }

    return {
      value,
      ...getDisplayValue(value)
    }
  }

  currency.ether = getEtherCurrency()

  const bnGwei = bn.shiftedBy(-9).decimalPlaces(6, BigNumber.ROUND_FLOOR)
  
  return {
    bn,
    ...currency,
    gwei: bnGwei.isZero() ? '' : bnGwei.toFormat(),
    wei: bn.toFormat(0)
  }
}
