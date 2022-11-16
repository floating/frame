import BigNumber from 'bignumber.js'
import { isHexString } from 'ethers/lib/utils'

const displayUnitMapping = {
  thousand: {
    lowerBound: BigNumber(999.99),
    upperBound: BigNumber(999999.99),
    unitDisplay: 'K'
  },
  million: {
    lowerBound: BigNumber(999999.99),
    upperBound: BigNumber(999999999.99),
    unitDisplay: 'M'
  },
  billion: {
    lowerBound: BigNumber(999999999.99),
    upperBound: BigNumber(999999999999.99),
    unitDisplay: 'B'
  },
  trillion: {
    lowerBound: BigNumber(999999999999.99),
    upperBound: BigNumber(999999999999999).plus(0.99), // working around the 15sd limit
    unitDisplay: 'T'
  },
  quadrillion: {
    lowerBound: BigNumber(999999999999999).plus(0.99), // working around the 15sd limit
    upperBound: BigNumber(Infinity),
    unitDisplay: 'Q'
  }
}
const maxDisplayValue = BigNumber(999999999999999999999)

function getDisplay (bn: BigNumber, context: string, decimals: number, displayFullValue?: boolean) {
  const value = bn.decimalPlaces(decimals, BigNumber.ROUND_FLOOR)
  if (value.isZero()) {
    return {
      approximationSymbol: '<',
      displayValue: BigNumber(`1e-${decimals}`).toFormat()
    }
  }

  if (!displayFullValue) {
    // shorthand display of large numbers
    for (const [unitName, { lowerBound, upperBound, unitDisplay }] of Object.entries(displayUnitMapping)) {
      if (value.isGreaterThan(lowerBound) && value.isLessThan(upperBound)) {
        const displayMax = value.isGreaterThan(maxDisplayValue)

        // maximum display value is hard coded because maxDisplayValue is above the bignumber 15sd limit
        return {
          approximationSymbol: displayMax ? '>' : '',
          displayValue: displayMax ? '999,999' : value.shiftedBy(-(lowerBound.sd(true) - 2)).decimalPlaces(3, BigNumber.ROUND_FLOOR).toFormat(),
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
    displayValue: value.toFormat(context === 'fiat' ? decimals : undefined)
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
    fiat: ({ displayDecimals } = { displayDecimals: true }) => {  
      const nativeCurrency = BigNumber(isTestnet || !currencyRate ? 0 : currencyRate.price)
      const displayedDecimals = displayDecimals ? 2 : 0
      const value = bn.shiftedBy(-decimals).multipliedBy(nativeCurrency)
      
      if (isTestnet || value.isNaN()) {
        return {
          value, 
          displayValue: '?'
        }
      }
    
      return {
        value,
        ...getDisplay(value, 'fiat', displayedDecimals, displayFullValue)
      }
    },
    ether: (decimalsOverride?: number) => {
      const displayDecimals = decimalsOverride === undefined ? 6 : decimalsOverride
      const value = bn.shiftedBy(-decimals) //|| decimals
  
      return {
        value,
        ...getDisplay(value, 'ether', displayDecimals, displayFullValue)
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
