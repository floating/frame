// A modified version of ipfs-only-hash, https://github.com/alanshaw/ipfs-only-hash/issues/18

import { globSource, CID } from 'ipfs-http-client'
import { importer, UserImporterOptions } from 'ipfs-unixfs-importer'
import { MemoryBlockstore } from 'blockstore-core/memory'

const hash = async (content: any, options: UserImporterOptions = {}) => {
  options.onlyHash = true
  if (typeof content === 'string') {
    content = [{ content: new TextEncoder().encode(content) }]
  } else if (content instanceof Object.getPrototypeOf(Uint8Array)) {
    content = [{ content }]
  }
  let lastCID
  for await (const c of importer(content, new MemoryBlockstore(), options)) {
    lastCID = c.cid
  }
  return lastCID
}

const hashFiles = async (path: string, options: UserImporterOptions) => {
  const files = globSource(path, '**')
  return await hash(files, options)
}

export const cidToHex = (cid: CID) => {
  return `0x${Buffer.from(cid.bytes.slice(2)).toString('hex')}`
}

export const getCID = async (path: string, dir: boolean) => {
  return await hashFiles(path, { cidVersion: 0, hidden: true, wrapWithDirectory: dir })
}
