// A modified version of ipfs-only-hash, https://github.com/alanshaw/ipfs-only-hash/issues/18

import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'
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

export function getDappCacheDir() {
  return path.join(app.getPath('userData'), 'DappCache')
}

export async function dappPathExists(dappId: string) {
  const cachedDappPath = `${getDappCacheDir()}/${dappId}`

  try {
    await fs.access(cachedDappPath)
    return true
  } catch (e) {
    return false
  }
}

export async function isDappVerified(dappId: string, contentCID: string) {
  const path = `${getDappCacheDir()}/${dappId}`
  const cid = await getCID(path)

  return cid?.toV1().toString() === contentCID
}
