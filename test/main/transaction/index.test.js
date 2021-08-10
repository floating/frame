import { addHexPrefix } from 'ethereumjs-util'
import Common from '@ethereumjs/common'

import { usesBaseFee, londonToLegacy, signerCompatibility, populate } from '../../../main/transaction'

describe('#signerCompatibility', () => {
  it('is always compatible with legacy transactions', () => {
    const tx = {
      type: '0x0'
    }

    const compatibility = signerCompatibility(tx, { type: 'anysigner' })

    expect(compatibility.signer).toBe('anysigner')
    expect(compatibility.tx).toBe('legacy')
    expect(compatibility.compatible).toBe(true)
  })

  it('is always compatible with eip-1559 transactions for seed signers', () => {
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'seed' })

    expect(compatibility.signer).toBe('seed')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is always compatible with eip-1559 transactions for ring signers', () => {
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ring' })

    expect(compatibility.signer).toBe('ring')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is not compatible for eip-1559 transactions on Ledger signers using eth app prior to 1.9.x', () => {
    const appVersion = { major: 1, minor: 7, patch: 4 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is compatible for eip-1559 transactions on Ledger signers using eth app 1.9.x', () => {
    const appVersion = { major: 1, minor: 9, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Ledger signers using eth app 2.x', () => {
    const appVersion = { major: 2, minor: 1, patch: 3 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is not compatible for eip-1559 transactions on Lattice signers using firmware prior to 0.11.x', () => {
    const appVersion = { major: 0, minor: 10, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is compatible for eip-1559 transactions on Lattice signers using firmware 0.11.x', () => {
    const appVersion = { major: 0, minor: 11, patch: 2 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Lattice signers using firmware 1.x', () => {
    const appVersion = { major: 1, minor: 0, patch: 2 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is not compatible for eip-1559 transactions on Trezor signers', () => {
    const appVersion = { major: 1, minor: 1, patch: 1 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })
})

describe('#londonToLegacy', () => {
  it('leaves a legacy transaction untouched', () => {
    const rawTx = {
      type: '0x0',
      gasPrice: '0x165a0bc00',
      gasLimit: '0x61a8',
      value: '0x6f05b59d3b20000',
      to: '0x6635f83421bf059cd8111f180f0727128685bae4',
      data: '0x0000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072'
    }

    const tx = londonToLegacy(rawTx)

    expect(parseInt(tx.type)).toBe(0)
    expect(tx.gasPrice).toBe(rawTx.gasPrice)
    expect(tx.gasLimit).toBe(rawTx.gasLimit)
    expect(tx.maxFeePerGas).toBe(undefined)
    expect(tx.maxPriorityFeePerGas).toBe(undefined)
    expect(tx.value).toBe(rawTx.value)
    expect(tx.to).toBe(rawTx.to)
    expect(tx.data).toBe(rawTx.data)
  })

  it('converts a London transaction to a legacy transaction', () => {
    const rawTx = {
      type: '0x2',
      maxFeePerGas: addHexPrefix(7e9.toString(16)),
      maxPriorityFeePerGas: addHexPrefix(2e9.toString(16)),
      gasLimit: '0x61a8',
      value: '0x6f05b59d3b20000',
      to: '0x6635f83421bf059cd8111f180f0727128685bae4',
      data: '0x0000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072'
    }

    const tx = londonToLegacy(rawTx)

    expect(parseInt(tx.type)).toBe(0)
    expect(tx.gasPrice).toBe(addHexPrefix(7e9.toString(16)))
    expect(tx.gasLimit).toBe(rawTx.gasLimit)
    expect(tx.maxFeePerGas).toBe(undefined)
    expect(tx.maxPriorityFeePerGas).toBe(undefined)
    expect(tx.value).toBe(rawTx.value)
    expect(tx.to).toBe(rawTx.to)
    expect(tx.data).toBe(rawTx.data)
  })
})

describe('#usesBaseFee', () => {
  it('identifies a legacy transaction that uses gas price', () => {
    const tx = {
      type: '0x0'
    }

    expect(usesBaseFee(tx)).toBe(false)
  })

  it('identifies a transaction that uses EIP-1559 base fees', () => {
    const tx = {
      type: '0x2'
    }

    expect(usesBaseFee(tx)).toBe(true)
  })
})

describe('#populate', () => {
  let gas
  const rawTx = {
    gasLimit: '0x61a8',
    value: '0x6f05b59d3b20000',
    to: '0x6635f83421bf059cd8111f180f0727128685bae4',
    data: '0x0000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072'
  }

  describe('legacy transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'berlin' })

    beforeEach(() => {
      gas = {
        price: {
          levels: {
            fast: ''
          }
        }
      }
    })

    it('sets the transaction type', () => {
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.type).toBe('0x0')
    })

    it('sets gas price', () => {
      gas.price.levels.fast = addHexPrefix(7e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.gasPrice).toBe(gas.price.levels.fast)
    })
  })

  describe('eip-1559 transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'london' })

    beforeEach(() => {
      gas = {
        price: {
          fees: {
            maxPriorityFeePerGas: '',
            maxBaseFeePerGas: ''
          }
        }
      }
    })

    it('sets the transaction type', () => {
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.type).toBe('0x2')
    })

    it('sets the max priority fee', () => {
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(2e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxPriorityFeePerGas).toBe(gas.price.fees.maxPriorityFeePerGas)
    })

    it('sets the max total fee', () => {
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(2e9.toString(16))
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(8e9.toString(16))

      const tx = populate(rawTx, chainConfig, gas)
      const totalFees = 2e9 + 8e9

      // add a rounded 5% buffer
      const expectedMaxFee = addHexPrefix((totalFees + 4e8).toString(16))

      expect(tx.maxFeePerGas).toBe(expectedMaxFee)
    })
  })
})
