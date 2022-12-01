import { Derivation, getDerivationPath } from '../../../../main/signers/Signer/derive'

describe('#getDerivationPath', () => {
  it('provides a legacy derivation path with no index', () => {
    const path = getDerivationPath(Derivation.legacy)

    expect(path).toBe("44'/60'/0'/")
  })

  it('provides a legacy derivation path with a non-zero index', () => {
    const path = getDerivationPath(Derivation.legacy, 3)

    expect(path).toBe("44'/60'/0'/3")
  })

  it('provides a legacy derivation path with a zero index', () => {
    const path = getDerivationPath(Derivation.legacy, 0)

    expect(path).toBe("44'/60'/0'/0")
  })

  it('provides a standard derivation path with no index', () => {
    const path = getDerivationPath(Derivation.standard)

    expect(path).toBe("44'/60'/0'/0/")
  })

  it('provides a standard derivation path with a non-zero index', () => {
    const path = getDerivationPath(Derivation.standard, 14)

    expect(path).toBe("44'/60'/0'/0/14")
  })

  it('provides a standard derivation path with a zero index', () => {
    const path = getDerivationPath(Derivation.standard, 0)

    expect(path).toBe("44'/60'/0'/0/0")
  })

  it('provides a testnet derivation path with no index', () => {
    const path = getDerivationPath(Derivation.testnet)

    expect(path).toBe("44'/1'/0'/0/")
  })

  it('provides a testnet derivation path with a non-zero index', () => {
    const path = getDerivationPath(Derivation.testnet, 9)

    expect(path).toBe("44'/1'/0'/0/9")
  })

  it('provides a testnet derivation path with a zero index', () => {
    const path = getDerivationPath(Derivation.testnet, 0)

    expect(path).toBe("44'/1'/0'/0/0")
  })

  it('provides a live derivation path with no index', () => {
    const path = getDerivationPath(Derivation.live)

    expect(path).toBe("44'/60'/'/0/0")
  })

  it('provides a live derivation path with a non-zero index', () => {
    const path = getDerivationPath(Derivation.live, 24)

    expect(path).toBe("44'/60'/24'/0/0")
  })

  it('provides a live derivation path with a zero index', () => {
    const path = getDerivationPath(Derivation.live, 0)

    expect(path).toBe("44'/60'/0'/0/0")
  })
})
