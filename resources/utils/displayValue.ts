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

function getDisplayValue (bn: BigNumber, decimalsOverride?: number, displayFullValue?: boolean) {
  if (!displayFullValue) {
    // shorthand display of large numbers
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
  }

  // display small numbers or full values
  return {
    displayValue: bn.toFormat(decimalsOverride)
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
    fiat: (decimalsOverride: number) => {  
      const nativeCurrency = BigNumber(isTestnet || !currencyRate ? 0 : currencyRate.price)
      const value = bn.shiftedBy(-decimals).multipliedBy(nativeCurrency).decimalPlaces(decimalsOverride, BigNumber.ROUND_FLOOR)
      
      if (isTestnet || value.isNaN()) {
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
        ...getDisplayValue(value, decimalsOverride, displayFullValue)
      }
    },
    ether: (decimalsOverride: number) => {
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
    },
    gwei: () => {
      const value = bn.shiftedBy(-9).decimalPlaces(6, BigNumber.ROUND_FLOOR)

      // return bnGwei.isZero() ? '' : bnGwei.toFormat()
      return {
        value,
        ...getDisplayValue(value)
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
