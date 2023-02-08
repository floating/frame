// A modified version of ipfs-only-hash, https://github.com/alanshaw/ipfs-only-hash/issues/18

import { globSource } from 'ipfs-http-client'
import { importer } from 'ipfs-unixfs-importer'

import type { UserImporterOptions } from 'ipfs-unixfs-importer/types'

const blockstore = {
  get: async (cid: string) => {
    throw new Error(`unexpected block API get for ${cid}`)
  },
  put: async () => {
    throw new Error('unexpected block API put')
  }
}

const hash = async (content: any, opts: UserImporterOptions = {}) => {
  const options = {
    ...opts,
    onlyHash: true,
    cidVersion: 0,
    hidden: true
  } as const

  if (typeof content === 'string') {
    content = [{ content: new TextEncoder().encode(content) }]
  } else if (content instanceof Object.getPrototypeOf(Uint8Array)) {
    content = [{ content }]
  }

  let lastCID

  for await (const c of importer(content, blockstore as any, options)) {
    lastCID = c.cid
  }

  return lastCID
}

const hashFiles = async (path: string, options: UserImporterOptions) => hash(globSource(path, '**'), options)
const getCID = async (path: string, isDirectory = true) => hashFiles(path, { wrapWithDirectory: isDirectory })

export async function verifyDapp(path: string, manifestCID: string) {
  const cid = await getCID(path)
  const v1 = cid?.toV1().toString()
  const match = cid?.toV1().toString() === manifestCID
  console.log({
    pathExpected:
      path ===
      '/home/matt/.config/Electron/DappCache/0xe8d705c28f65bc3fe10df8b22f9daa265b99d0e1893b2df49fd38120f0410bca',
    path,
    v1,
    manifestCID,
    cid,
    match
  })
  return match
}
