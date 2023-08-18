import { latest as GasSchema } from '../../../../../main/store/state/types/gas'

const validGas = {
  fees: {
    maxPriorityFeePerGas: '0x1',
    maxBaseFeePerGas: '0x2',
    maxFeePerGas: '0x3',
    nextBaseFee: '0x1'
  },
  price: {
    selected: 'standard',
    levels: {
      slow: '0x1',
      standard: '0x2',
      fast: '0x3',
      asap: '0x4'
    }
  }
}

it('does not persist gas fees', () => {
  const gas = GasSchema.parse(validGas)

  expect(gas.fees).toBeNull()
})

it('loads empty gas fees as null', () => {
  const persistedGas = {
    ...validGas,
    fees: {}
  }

  const gas = GasSchema.parse(persistedGas)

  expect(gas.fees).toBeNull()
})

it('loads missing gas fees as null', () => {
  const { price } = validGas

  const gas = GasSchema.parse({ price })

  expect(gas.fees).toBeNull()
})

it('does not persist gas levels', () => {
  const gas = GasSchema.parse(validGas)

  expect(gas.price.levels).toStrictEqual({
    slow: '',
    standard: '',
    fast: '',
    asap: '',
    custom: ''
  })
})
