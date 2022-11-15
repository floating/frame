import { BigNumber } from 'bignumber.js'
import { displayValueData } from '../../../resources/utils/displayValue'

describe('wei', () => {
  it('should return a wei value', () => {
    const displayValue = displayValueData(356)
    expect(displayValue.wei()).toStrictEqual({ displayValue: '356', value: BigNumber('356') })
  })
})

describe('gwei', () => {
  it('should return a gwei value', () => {
    const displayValue = displayValueData(356e9)
    expect(displayValue.gwei()).toStrictEqual({ displayValue: '356', value: BigNumber('356') })
  })

  it('should not return a gwei value of more than 6dp', () => {
    const displayValue = displayValueData(356e-18)
    expect(displayValue.gwei()).toStrictEqual({ displayValue: '0', value: BigNumber('0') })
  })
})

describe('fiat currency', () => {
  it('should return zero when no currency rate is provided', () => {
    const value = displayValueData(356e24)
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '<',
      displayValue: '0.01', 
      value: BigNumber(0)
    })
  })

  it('should return "testnet zero" when isTestnet is true', () => {
    const value = displayValueData(356e24, { currencyRate: { price: BigNumber(1.3) }, isTestnet: true })
    expect(value.fiat()).toStrictEqual({
      displayValue: '?',
      value: BigNumber(0)
    })
  })

  it('should return a value of thousands', () => {
    const value = displayValueData(356e20, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'thousand',
        shortName: 'K',
      },
      displayValue: '35.6',
      value: BigNumber(35600)
    })
  })

  it('should return a value of millions', () => {
    const value = displayValueData(356e23, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'million',
        shortName: 'M',
      },
      displayValue: '35.6',
      value: BigNumber(35600000)
    })
  })

  it('should return a value of billions', () => {
    const value = displayValueData(356e26, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'billion',
        shortName: 'B',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000)
    })
  })

  it('should return a value of trillions', () => {
    const value = displayValueData(356e29, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'trillion',
        shortName: 'T',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000000)
    })
  })

  it('should return a value of quadrillions', () => {
    const value = displayValueData(356e32, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'quadrillion',
        shortName: 'Q',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000000000)
    })
  })

  it('should return a maximum value', () => {
    const value = displayValueData(356e50, { currencyRate: { price: BigNumber(1) }})
    expect(value.fiat()).toStrictEqual({
      approximationSymbol: '>',
      displayUnit: {
        fullName: 'quadrillion',
        shortName: 'Q',
      },
      displayValue: '999,999',
      value: BigNumber(3.56e+34)
    })
  })
})

describe('ether currency', () => {
  it('should handle values smaller than the number of decimals requested', () => {
    const value = displayValueData(356e-8, { decimalsOverride: 6 })
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '<',
      displayValue: '0.000001', 
      value: BigNumber(0)
    })
  })

  it('should return a value of thousands', () => {
    const value = displayValueData(356e20)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'thousand',
        shortName: 'K',
      },
      displayValue: '35.6',
      value: BigNumber(35600)
    })
  })

  it('should return a value of millions', () => {
    const value = displayValueData(356e23)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'million',
        shortName: 'M',
      },
      displayValue: '35.6',
      value: BigNumber(35600000)
    })
  })

  it('should return a value of billions', () => {
    const value = displayValueData(356e26)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'billion',
        shortName: 'B',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000)
    })
  })

  it('should return a value of trillions', () => {
    const value = displayValueData(356e29)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'trillion',
        shortName: 'T',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000000)
    })
  })

  it('should return a value of quadrillions', () => {
    const value = displayValueData(356e32)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '',
      displayUnit: {
        fullName: 'quadrillion',
        shortName: 'Q',
      },
      displayValue: '35.6',
      value: BigNumber(35600000000000000)
    })
  })

  it('should return a maximum value', () => {
    const value = displayValueData(356e50)
    expect(value.ether()).toStrictEqual({
      approximationSymbol: '>',
      displayUnit: {
        fullName: 'quadrillion',
        shortName: 'Q',
      },
      displayValue: '999,999',
      value: BigNumber(3.56e+34)
    })
  })
})
