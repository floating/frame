import {
  buildDerivationCandidates,
  normalizeChildrenPath,
  normalizeOriginPath
} from '../../../../main/signers/qr/derivation'

describe('qr derivation resolver', () => {
  it('normalizes origin and children paths', () => {
    expect(normalizeOriginPath("44'/60'/0'")).toBe("m/44'/60'/0'")
    expect(normalizeOriginPath("/44'/60'/0'/")).toBe("m/44'/60'/0'")
    expect(normalizeChildrenPath('/0/*/')).toBe('0/*')
  })

  it('uses legacy default candidates when children path is missing', () => {
    const candidates = buildDerivationCandidates("m/44'/60'/0'", undefined, 5)

    expect(candidates).toEqual([
      {
        strategy: 'legacy-default',
        relativePath: '0/5',
        fullPath: "m/44'/60'/0'/0/5"
      },
      {
        strategy: 'index-only-fallback',
        relativePath: '5',
        fullPath: "m/44'/60'/0'/5"
      }
    ])
  })

  it('materializes wildcard children paths', () => {
    const candidates = buildDerivationCandidates("m/44'/60'/0'", '0/*', 3)

    expect(candidates[0]).toEqual({
      strategy: 'children-wildcard',
      relativePath: '0/3',
      fullPath: "m/44'/60'/0'/0/3"
    })
    expect(candidates[1]).toEqual({
      strategy: 'index-only-fallback',
      relativePath: '3',
      fullPath: "m/44'/60'/0'/3"
    })
  })

  it('appends index for fixed children paths', () => {
    const candidates = buildDerivationCandidates("m/44'/60'/0'", '1', 9)

    expect(candidates[0]).toEqual({
      strategy: 'children-fixed',
      relativePath: '1/9',
      fullPath: "m/44'/60'/0'/1/9"
    })
    expect(candidates[1]).toEqual({
      strategy: 'legacy-default',
      relativePath: '0/9',
      fullPath: "m/44'/60'/0'/0/9"
    })
  })
})
