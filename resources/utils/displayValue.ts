import BigNumber from 'bignumber.js'
import { isHexString } from 'ethers/lib/utils'

const displayUnitMapping = {
  thousand: {
    lowerBound: BigNumber(999),
    upperBound: BigNumber(999999),
    unitDisplay: 'K'
  },
  million: {
    lowerBound: BigNumber(999999),
    upperBound: BigNumber(999999999),
    unitDisplay: 'M'
  },
  billion: {
    lowerBound: BigNumber(999999999),
    upperBound: BigNumber(999999999999),
    unitDisplay: 'B'
  },
  trillion: {
    lowerBound: BigNumber(999999999999),
    upperBound: BigNumber(999999999999999),
    unitDisplay: 'T'
  },
  quadrillion: {
    lowerBound: BigNumber(999999999999999),
    upperBound: BigNumber(Infinity),
    unitDisplay: 'Q'
  }
}
const maxDisplayValue = BigNumber(999999999999999999999)

function getShorthandDisplayValue (bn: BigNumber, shiftedBy: number, decimalPlaces: number) {
  const value = bn.shiftedBy(shiftedBy)

  if (decimalPlaces !== 2) {
    return value.decimalPlaces(decimalPlaces).toFormat()
  }

  return value.sd(3).toFormat()
}

function getDisplay (bn: BigNumber, context: string, decimalsOverride: number, displayFullValue?: boolean) {
  if (bn.isZero()) {
    return {
      approximationSymbol: '<',
      displayValue: BigNumber(`1e-${decimalsOverride}`).toFormat()
    }
  }

  if (!displayFullValue) {
    // shorthand display of large numbers
    for (const [unitName, { lowerBound, upperBound, unitDisplay }] of Object.entries(displayUnitMapping)) {
      if (bn.isGreaterThan(lowerBound) && bn.isLessThan(upperBound)) {
        const displayMax = bn.isGreaterThan(maxDisplayValue)

        // maximum display value is hard coded because maxDisplayValue is above the bignumber 15sd limit
        return {
          approximationSymbol: displayMax ? '>' : '',
          displayValue: displayMax ? '999,999' : getShorthandDisplayValue(bn, -(lowerBound.sd(true)), decimalsOverride),
          displayUnit: {
            fullName: unitName,
            shortName: unitDisplay
          }
        }
      }
    }
  }

  // display small numbers or full values
  return {
    displayValue: bn.toFormat(context === 'fiat' ? decimalsOverride : undefined)
  }
}

type DisplayValueDataParams = { 
  currencyRate?: Rate
  displayFullValue?: boolean 
  decimals: number
  isTestnet: boolean
}

type SourceValue = string | number | BigNumber

export function displayValueData (sourceValue: SourceValue, params: DisplayValueDataParams) {
  const { currencyRate, decimals = 18, isTestnet = false, displayFullValue = false } = params || {} as DisplayValueDataParams
  const bn = BigNumber(sourceValue, isHexString(sourceValue) ? 16 : undefined)
  const currencyHelperMap = {
    fiat: (decimalsOverride = 2) => {  
      const nativeCurrency = BigNumber(isTestnet || !currencyRate ? 0 : currencyRate.price)
      const value = bn.shiftedBy(-decimals).multipliedBy(nativeCurrency).decimalPlaces(decimalsOverride, BigNumber.ROUND_FLOOR)
      
      if (isTestnet || value.isNaN()) {
        return {
          value, 
          displayValue: '?'
        }
      }
    
      return {
        value,
        ...getDisplay(value, 'fiat', decimalsOverride, displayFullValue)
      }
    },
    ether: (decimalsOverride = 6) => {
      const value = bn.shiftedBy(-decimals).decimalPlaces(decimalsOverride || decimals, BigNumber.ROUND_FLOOR)
  
      return {
        value,
        ...getDisplay(value, 'ether', decimalsOverride, displayFullValue)
      }
    },
    gwei: () => {
      const value = bn.shiftedBy(-9).decimalPlaces(6, BigNumber.ROUND_FLOOR)

      return {
        value,
        displayValue: value.isZero() ? '0' : value.toFormat()
      }
    },
    wei: () => ({
      value: bn,
      displayValue: bn.toFormat(0)
    })
  }
  
  return {
    bn,
    ...currencyHelperMap
  }
}
