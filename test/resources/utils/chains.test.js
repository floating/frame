import { calculateOptimismL1DataFee } from '../../../resources/utils/chains'

describe('#calculateOptimismL1DataFee', () => {
  it('calculates a fee for a serialized transaction', () => {
    const serializedTx =
      '0x02ed0a80837853be837854b3827b0c94b120c885f1527394c78d50e7c7da57defb24f61288016345785d8a000080c0'
    const baseFee = '0x' + (35e9).toString(16) // 35 gwei

    const fee = calculateOptimismL1DataFee(serializedTx, baseFee)

    expect(fee).toBe(47975760000000)
  })

  it('calculates a fee as zero if no given base fee', () => {
    const serializedTx =
      '0x02ed0a80837853be837854b3827b0c94b120c885f1527394c78d50e7c7da57defb24f61288016345785d8a000080c0'

    const fee = calculateOptimismL1DataFee(serializedTx, NaN)

    expect(fee).toBe(0)
  })
})
