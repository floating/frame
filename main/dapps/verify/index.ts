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
    path,
    v1,
    manifestCID,
    cid,
    match
  })
  return match
}
