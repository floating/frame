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

  describe('when displaying decimals', () => {
    it('should return a value of less than a cent', () => {
      const value = displayValueData(356e12, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '<',
        displayValue: '0.01', 
        value: BigNumber(0.000356)
      })
    })

    it('should return a value less than 1000 with a fixed 2dp', () => {
      const value = displayValueData(999999e15, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        displayValue: '999.99', 
        value: BigNumber(999.999)
      })
    })
  })

  describe('when not displaying decimals', () => {
    it('should return a value of less than a dollar', () => {
      const value = displayValueData(356e12, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat({ displayDecimals: false })).toStrictEqual({
        approximationSymbol: '<',
        displayValue: '1', 
        value: BigNumber(0.000356)
      })
    })

    it('should return a value less than 1000 without decimals', () => {
      const value = displayValueData(999999e15, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat({ displayDecimals: false })).toStrictEqual({
        displayValue: '999', 
        value: BigNumber(999.999)
      })
    })
  })

  describe('shorthand large values', () => {
    it('should return a value of thousands to 3dp', () => {
      const value = displayValueData(356253e17, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35.625',
        value: BigNumber(35625.3)
      })
    })

    it('should round down a value of thousands to 3dp', () => {
      const value = displayValueData(356259e17, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35.625',
        value: BigNumber(35625.9)
      })
    })

    it('should return an exact value of thousands', () => {
      const value = displayValueData(35e21, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35',
        value: BigNumber(35000)
      })
    })

    it('should return a value of millions to 3dp', () => {
      const value = displayValueData(356253e20, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35.625',
        value: BigNumber(35625300)
      })
    })

    it('should round down a value of millions to 3dp', () => {
      const value = displayValueData(356259e20, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35.625',
        value: BigNumber(35625900)
      })
    })

    it('should return an exact value of millions', () => {
      const value = displayValueData(35e24, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35',
        value: BigNumber(35000000)
      })
    })

    it('should return a value of billions to 3dp', () => {
      const value = displayValueData(356253e23, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000)
      })
    })

    it('should round down a value of billions to 3dp', () => {
      const value = displayValueData(356259e23, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000)
      })
    })

    it('should return an exact value of billions', () => {
      const value = displayValueData(35e27, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35',
        value: BigNumber(35000000000)
      })
    })

    it('should return a value of trillions to 3dp', () => {
      const value = displayValueData(356253e26, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000000)
      })
    })

    it('should round down a value of trillions to 3dp', () => {
      const value = displayValueData(356259e26, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000000)
      })
    })

    it('should return an exact value of trillions', () => {
      const value = displayValueData(35e30, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35',
        value: BigNumber(35000000000000)
      })
    })

    it('should return a value of quadrillions to 3dp', () => {
      const value = displayValueData(356253e29, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000000000)
      })
    })

    it('should round down a value of quadrillions to 3dp', () => {
      const value = displayValueData(356259e29, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000000000)
      })
    })

    it('should return an exact value of quadrillions', () => {
      const value = displayValueData(35e33, { currencyRate: { price: BigNumber(1) }})
      expect(value.fiat()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35',
        value: BigNumber(35000000000000000)
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
})


describe('ether currency', () => {
  describe('when displaying decimals', () => {
    it('should return a value of less than 1000 gwei', () => {
      const value = displayValueData(356e8)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '<',
        displayValue: '0.000001', 
        value: BigNumber(3.56e-8)
      })
    })

    it('should return a value less than 1000 with a fixed 3dp', () => {
      const value = displayValueData(998.5678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '998.567', 
        value: BigNumber(998.5678111111)
      })
    })

    it('should return a value less than 100 with a fixed 4dp', () => {
      const value = displayValueData(99.85678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '99.8567', 
        value: BigNumber(99.85678111111)
      })
    })

    it('should return a value less than 10 with a fixed 5dp', () => {
      const value = displayValueData(9.985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '9.98567', 
        value: BigNumber(9.985678111111)
      })
    })

    it('should return a value less than 1 with a fixed 6dp', () => {
      const value = displayValueData(0.9985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.998567', 
        value: BigNumber(0.9985678111111)
      })
    })

    it('should return a value less than 0.1 with a fixed 6dp', () => {
      const value = displayValueData(0.09985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.099856', 
        value: BigNumber(0.09985678111111)
      })
    })

    it('should return a value less than 0.01 with a fixed 6dp', () => {
      const value = displayValueData(0.009985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.009985', 
        value: BigNumber(0.009985678111111)
      })
    })

    it('should return a value less than 0.001 with a fixed 6dp', () => {
      const value = displayValueData(0.0009985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.000998', 
        value: BigNumber(0.0009985678111111)
      })
    })

    it('should return a value less than 0.0001 with a fixed 6dp', () => {
      const value = displayValueData(0.00009985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.000099', 
        value: BigNumber(0.00009985678111111)
      })
    })

    it('should return a value less than 0.00001 with a fixed 6dp', () => {
      const value = displayValueData(0.000009985678111111e18)
      expect(value.ether()).toStrictEqual({
        displayValue: '0.000009', 
        value: BigNumber(0.000009985678111111)
      })
    })
  })

  describe('when not displaying decimals', () => {
    it('should return a value of less than 1', () => {
      const value = displayValueData(356e12)
      expect(value.ether({ displayDecimals: false })).toStrictEqual({
        approximationSymbol: '<',
        displayValue: '1', 
        value: BigNumber(0.000356)
      })
    })

    it('should return a value less than 1000 without decimals', () => {
      const value = displayValueData(999999e15)
      expect(value.ether({ displayDecimals: false })).toStrictEqual({
        displayValue: '999', 
        value: BigNumber(999.999)
      })
    })
  })

  describe('shorthand large values', () => {
    it('should return a value of thousands to 3dp', () => {
      const value = displayValueData(356253e17)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35.625',
        value: BigNumber(35625.3)
      })
    })

    it('should round down a value of thousands to 3dp', () => {
      const value = displayValueData(356259e17)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35.625',
        value: BigNumber(35625.9)
      })
    })

    it('should return an exact value of thousands', () => {
      const value = displayValueData(35e21)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'thousand',
          shortName: 'K',
        },
        displayValue: '35',
        value: BigNumber(35000)
      })
    })

    it('should return a value of millions to 3dp', () => {
      const value = displayValueData(356253e20)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35.625',
        value: BigNumber(35625300)
      })
    })

    it('should round down a value of millions to 3dp', () => {
      const value = displayValueData(356259e20)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35.625',
        value: BigNumber(35625900)
      })
    })

    it('should return an exact value of millions', () => {
      const value = displayValueData(35e24)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'million',
          shortName: 'M',
        },
        displayValue: '35',
        value: BigNumber(35000000)
      })
    })

    it('should return a value of billions to 3dp', () => {
      const value = displayValueData(356253e23)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000)
      })
    })

    it('should round down a value of billions to 3dp', () => {
      const value = displayValueData(356259e23)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000)
      })
    })

    it('should return an exact value of billions', () => {
      const value = displayValueData(35e27)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'billion',
          shortName: 'B',
        },
        displayValue: '35',
        value: BigNumber(35000000000)
      })
    })

    it('should return a value of trillions to 3dp', () => {
      const value = displayValueData(356253e26)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000000)
      })
    })

    it('should round down a value of trillions to 3dp', () => {
      const value = displayValueData(356259e26)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000000)
      })
    })

    it('should return an exact value of trillions', () => {
      const value = displayValueData(35e30)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'trillion',
          shortName: 'T',
        },
        displayValue: '35',
        value: BigNumber(35000000000000)
      })
    })

    it('should return a value of quadrillions to 3dp', () => {
      const value = displayValueData(356253e29)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35.625',
        value: BigNumber(35625300000000000)
      })
    })

    it('should round down a value of quadrillions to 3dp', () => {
      const value = displayValueData(356259e29)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35.625',
        value: BigNumber(35625900000000000)
      })
    })

    it('should return an exact value of quadrillions', () => {
      const value = displayValueData(35e33)
      expect(value.ether()).toStrictEqual({
        approximationSymbol: '',
        displayUnit: {
          fullName: 'quadrillion',
          shortName: 'Q',
        },
        displayValue: '35',
        value: BigNumber(35000000000000000)
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
})
