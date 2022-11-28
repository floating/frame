import { addHexPrefix, stripHexPrefix } from '@ethereumjs/util'
import {Common} from '@ethereumjs/common'

import { maxFee, londonToLegacy, signerCompatibility, populate, sign } from '../../../main/transaction'
import { GasFeesSource } from '../../../resources/domain/transaction'
import { parseTransaction } from 'ethers/lib/utils'
import { hexToInt } from '../../../resources/utils'

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

  it('is not compatible for eip-1559 transactions on Trezor One signers using firmware prior to 1.10.4', () => {
    const appVersion = { major: 1, minor: 10, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion, model: 'Trezor One' })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is not compatible for eip-1559 transactions on Trezor T signers using firmware prior to 2.4.2', () => {
    const appVersion = { major: 2, minor: 4, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion, model: 'Trezor T' })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is compatible for eip-1559 transactions on Trezor One signers using firmware 1.10.4+', () => {
    const appVersion = { major: 1, minor: 11, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion, model: 'Trezor One' })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Trezor T signers using firmware 2.4.2+', () => {
    const appVersion = { major: 2, minor: 5, patch: 1 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion, model: 'Trezor T' })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Trezor signers using firmware 3.x', () => {
    const appVersion = { major: 3, minor: 2, patch: 4 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'trezor', appVersion, model: 'Trezor T' })

    expect(compatibility.signer).toBe('trezor')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
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

describe('#maxFee', () => {
  it('sets the max fee as 2 ETH on mainnet', () => {
    const tx = {
      chainId: addHexPrefix((1).toString(16))
    }

    expect(maxFee(tx)).toBe(2e18)
  })

  it('sets the max fee as 250 FTM on Fantom', () => {
    const tx = {
      chainId: addHexPrefix((250).toString(16))
    }

    expect(maxFee(tx)).toBe(250e18)
  })

  it('sets the max fee as 50 on other chains', () => {
    const tx = {
      chainId: addHexPrefix((255).toString(16))
    }

    expect(maxFee(tx)).toBe(5e19)
  })
})

describe('#populate', () => {
  let gas
  let rawTx

  beforeEach(() => {
    gas = {
      price: {
        levels: {
          fast: ''
        }
      }
    }
    rawTx = {
      gasLimit: '0x61a8',
      value: '0x6f05b59d3b20000',
      to: '0x6635f83421bf059cd8111f180f0727128685bae4',
      data: '0x0000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072',
      gasFeesSource: GasFeesSource.Dapp
    }
  })

  describe('legacy transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'istanbul' })

    it('sets the transaction type', () => {
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.type).toBe('0x0')
    })

    it('uses Frame-supplied gasPrice when the dapp did not specify a value', () => {
      gas.price.levels.fast = addHexPrefix(7e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.gasPrice).toBe(gas.price.levels.fast)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses Frame-supplied gasPrice when the dapp specified an invalid value', () => {
      gas.price.levels.fast = addHexPrefix(7e9.toString(16))
      rawTx.gasPrice = ''
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.gasPrice).toBe(gas.price.levels.fast)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses dapp-supplied gasPrice when the dapp specified a valid value', () => {
      gas.price.levels.fast = addHexPrefix(7e9.toString(16))
      rawTx.gasPrice = 6e9.toString(16)
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.gasPrice).toBe(rawTx.gasPrice)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
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

    it('calculates maxFeePerGas when the dapp did not specify a value', () => {
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(7e9.toString(16))
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 3e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('calculates maxFeePerGas when the dapp specified an invalid value', () => {
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(7e9.toString(16))
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      rawTx.maxFeePerGas = ''
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 3e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('calculates maxFeePerGas using a dapp-supplied value of maxPriorityFeePerGas', () => {
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(7e9.toString(16))
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      rawTx.maxPriorityFeePerGas = addHexPrefix(4e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 4e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })

    it('uses dapp-supplied maxFeePerGas when the dapp specified a valid value', () => {
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(7e9.toString(16))
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      rawTx.maxFeePerGas = 6e9.toString(16)
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxFeePerGas).toBe(rawTx.maxFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })

    it('uses Frame-supplied maxPriorityFeePerGas when the dapp did not specify a value', () => {
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxPriorityFeePerGas).toBe(gas.price.fees.maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses Frame-supplied maxPriorityFeePerGas when the dapp specified an invalid value', () => {
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      rawTx.maxFeePerGas = ''
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxPriorityFeePerGas).toBe(gas.price.fees.maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses dapp-supplied maxPriorityFeePerGas when the dapp specified a valid value', () => {
      gas.price.fees.maxBaseFeePerGas = addHexPrefix(7e9.toString(16))
      gas.price.fees.maxPriorityFeePerGas = addHexPrefix(3e9.toString(16))
      rawTx.maxPriorityFeePerGas = 6e9.toString(16)
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.maxPriorityFeePerGas).toBe(rawTx.maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })
  })

  describe('eip-2930 transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'berlin' })

    it('sets the transaction type', () => {
      const tx = populate(rawTx, chainConfig, gas)

      expect(tx.type).toBe('0x1')
    })
  })
})

describe('#sign', () => {
  const baseTx = {
    nonce: '0x33',
    gasLimit: '0x61a8',
    value: '0x6f05b59d3b20000',
    to: '0x6635f83421bf059cd8111f180f0727128685bae4',
    data: '0x00000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072'
  }

  const signature = {
    v: '0x00',
    r: '0xd693b532a80fed6392b428604171fb32fdbf953728a3a7ecc7d4062b1652c042',
    s: '0x24e9c602ac800b983b035700a14b23f78a253ab762deab5dc27e3555a750b354'
  }

  it('generates a signed legacy transaction', async () => {
    const rawTx = { 
      ...baseTx,
      type: '0x0',
      gasPrice: '0x737be7600'
    }
    
    const signedTx = await sign(rawTx, jest.fn().mockResolvedValueOnce(signature))
    const expectedSignedTx = '0xf89433850737be76008261a8946635f83421bf059cd8111f180f0727128685bae48806f05b59d3b20000a800000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f07200a0d693b532a80fed6392b428604171fb32fdbf953728a3a7ecc7d4062b1652c042a024e9c602ac800b983b035700a14b23f78a253ab762deab5dc27e3555a750b354'
    expect(signedTx).toBe(expectedSignedTx)

    const parsedSignedTx = parseTransaction(signedTx)
    const expectedParsedSignedTx = {
      ...parseTransaction(expectedSignedTx),
      ...signature,
      v: hexToInt(signature.v)
    }
    expect(parsedSignedTx).toMatchObject(expectedParsedSignedTx)
  })

  it('generates a signed eip-1559 transaction', async () => {
    const rawTx = { 
      ...baseTx,
      type: '0x2',
      maxFeePerGas: '0x737be7600',
      maxPriorityFeePerGas: '0x3'
    }

    const signedTx = await sign(rawTx, jest.fn().mockResolvedValueOnce(signature))
    const expectedSignedTx = '0x02f897803303850737be76008261a8946635f83421bf059cd8111f180f0727128685bae48806f05b59d3b20000a800000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072c080a0d693b532a80fed6392b428604171fb32fdbf953728a3a7ecc7d4062b1652c042a024e9c602ac800b983b035700a14b23f78a253ab762deab5dc27e3555a750b354'
    expect(signedTx).toBe(expectedSignedTx)

    const parsedSignedTx = parseTransaction(signedTx)

    const expectedParsed = {
      ...parseTransaction(expectedSignedTx),
      ...signature,
      v: hexToInt(signature.v)
    }
    expect(parsedSignedTx).toMatchObject(expectedParsed)
  })

  it('adds hex prefixes to the signature', async () => {
    const signedTx = await sign(baseTx, jest.fn().mockResolvedValueOnce({
      v: stripHexPrefix(signature.v),
      r: stripHexPrefix(signature.r),
      s: stripHexPrefix(signature.s)
    }))
    
    const {r, s, v} = parseTransaction(signedTx)

    expect({
      r,s,v
    }).toMatchObject({
      ...signature,
      v: 0 // additional zeroes are stripped
    })
  })
})
