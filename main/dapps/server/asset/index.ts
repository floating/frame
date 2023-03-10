import fs from 'fs'
import path from 'path'

import getType from './getType'
import { getDappCacheDir } from '../../verify'

import type { ServerResponse } from 'http'

function getAssetPath(asset: string, namehash: string) {
  const rootPath = asset === '/' ? '/index.html' : asset
  return { rootPath, assetPath: path.join(getDappCacheDir(), namehash, rootPath) }
}

function error(res: ServerResponse, message: string, code = 404) {
  res.writeHead(code || 404)
  res.end(message)
}

export default {
  stream: (res: ServerResponse, namehash: string, asset: string) => {
    const { rootPath, assetPath } = getAssetPath(asset, namehash)

    const handleError = (err: Error) => {
      console.error(`Could not stream asset: ${asset}`, err)
      error(res, err.message)
    }

    if (fs.existsSync(assetPath)) {
      try {
        const stream = fs.createReadStream(assetPath)
        res.setHeader('content-type', getType(rootPath))
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
        res.writeHead(200)

        stream.once('error', handleError)
        stream.pipe(res)
      } catch (e) {
        handleError(e as Error)
      }
    } else {
      error(res, asset === '/' ? 'Dapp not found' : 'Asset not found')
    }
  }
}
