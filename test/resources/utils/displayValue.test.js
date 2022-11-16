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


// describe('ether currency', () => {
//   it('should handle values smaller than the number of decimals requested', () => {
//     const value = displayValueData(356e-8, { decimalsOverride: 6 })
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '<',
//       displayValue: '0.000001', 
//       value: BigNumber(0)
//     })
//   })  // 999.0000111111 1203.0002231223

//   it('should handle values smaller than the number of decimals requested', () => {
//     const value = displayValueData((998.0000111111 * 1e18))
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '<',
//       displayValue: '0.000001', 
//       value: BigNumber(0)
//     })
//   })

//   it('should return a value of thousands', () => {
//     const value = displayValueData(356e20)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '',
//       displayUnit: {
//         fullName: 'thousand',
//         shortName: 'K',
//       },
//       displayValue: '35.6',
//       value: BigNumber(35600)
//     })
//   })

//   it('should return a value of millions', () => {
//     const value = displayValueData(356e23)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '',
//       displayUnit: {
//         fullName: 'million',
//         shortName: 'M',
//       },
//       displayValue: '35.6',
//       value: BigNumber(35600000)
//     })
//   })

//   it('should return a value of billions', () => {
//     const value = displayValueData(356e26)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '',
//       displayUnit: {
//         fullName: 'billion',
//         shortName: 'B',
//       },
//       displayValue: '35.6',
//       value: BigNumber(35600000000)
//     })
//   })

//   it('should return a value of trillions', () => {
//     const value = displayValueData(356e29)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '',
//       displayUnit: {
//         fullName: 'trillion',
//         shortName: 'T',
//       },
//       displayValue: '35.6',
//       value: BigNumber(35600000000000)
//     })
//   })

//   it('should return a value of quadrillions', () => {
//     const value = displayValueData(356e32)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '',
//       displayUnit: {
//         fullName: 'quadrillion',
//         shortName: 'Q',
//       },
//       displayValue: '35.6',
//       value: BigNumber(35600000000000000)
//     })
//   })

//   it('should return a maximum value', () => {
//     const value = displayValueData(356e50)
//     expect(value.ether()).toStrictEqual({
//       approximationSymbol: '>',
//       displayUnit: {
//         fullName: 'quadrillion',
//         shortName: 'Q',
//       },
//       displayValue: '999,999',
//       value: BigNumber(3.56e+34)
//     })
//   })
// })
