import fs from 'fs/promises'
import { importer } from 'ipfs-unixfs-importer'
import { CID } from 'multiformats'

import { dappPathExists, isDappVerified } from '../../../../main/dapps/verify'

jest.mock('fs', () => ({
  access: jest.fn()
}))

jest.mock('electron', () => ({ app: { getPath: () => '/home/user/.config' } }))

jest.mock('ipfs-unixfs-importer', () => ({
  importer: jest.fn()
}))

jest.mock('ipfs-http-client', () => ({
  globSource: (...args) => {
    return { getArgs: () => args }
  }
}))

describe('#dappPathExists', () => {
  beforeEach(() => {
    fs.access = jest.fn()
  })

  it('determines that a dapp exists in the dapp cache', async () => {
    fs.access.mockResolvedValue()

    const exists = dappPathExists('0xmydapp')

    expect(fs.access).toHaveBeenCalledWith('/home/user/.config/DappCache/0xmydapp')
    return expect(exists).resolves.toBe(true)
  })

  it('determines that a dapp does not exist in the dapp cache', async () => {
    fs.access.mockRejectedValue(new Error('directory does not exist'))

    const exists = dappPathExists('0xmydapp')

    expect(fs.access).toHaveBeenCalledWith('/home/user/.config/DappCache/0xmydapp')
    return expect(exists).resolves.toBe(false)
  })
})

describe('#isDappVerified', () => {
  const dappRootCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
  const dappImageCid = 'bafkreidgvpkjawlxz6sffxzwgooowe5yt7i6wsyg236mfoks77nywkptdq'

  beforeEach(() => {
    importer.mockImplementation(() => createMockDirectoryImporter([dappImageCid, dappRootCid]))
  })

  it('verifies the dapp if the content matches what is stored on disk', async () => {
    return expect(isDappVerified('0xdapp', dappRootCid)).resolves.toBe(true)
  })

  it('does not verify the dapp if the content does not match what is stored on disk', async () => {
    const contentCid = 'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea'

    return expect(isDappVerified('0xdapp', contentCid)).resolves.toBe(false)
  })

  it('looks in the dapp cache directory to verify the existing dapp content', async () => {
    await isDappVerified('0xdapp', dappRootCid)

    const contentSourceGlob = importer.mock.calls[0][0].getArgs()
    expect(contentSourceGlob).toStrictEqual(['/home/user/.config/DappCache/0xdapp', '**'])
  })
})

// provide cids in reverse hierarchical order (ie root comes last) to mimic actual directory structure
function createMockDirectoryImporter(cids) {
  return {
    [Symbol.asyncIterator]() {
      return {
        current: 0,
        async next() {
          if (this.current < cids.length) {
            this.current++
            return { done: false, value: { cid: CID.parse(cids[this.current - 1]) } }
          }

          return { done: true }
        }
      }
    }
  }
}
