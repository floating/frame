import fs from 'fs'
import path from 'path'
import { app } from 'electron'

import getType from './getType'
import { ServerResponse } from 'http'

function error(res: ServerResponse, code: number, message: string) {
  res.writeHead(code || 404)
  res.end(message)
}

const dappCache = path.join(app.getPath('userData'), 'DappCache')

export default {
  stream: async (res: ServerResponse, namehash: string, asset: string) => {
    if (asset === '/') asset = '/index.html'
    const assetPath = path.join(dappCache, namehash, asset)
    if (fs.existsSync(assetPath)) {
      try {
        const stream = fs.createReadStream(assetPath)
        res.setHeader('content-type', getType(asset))
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
        res.writeHead(200)
        stream.pipe(res)
      } catch (e) {
        console.error(e)
        error(res, 404, (e as NodeJS.ErrnoException).message)
      }
    } else {
      error(res, 404, asset === '/' ? 'Dapp not found' : 'Asset not found')
    }
  }
}
