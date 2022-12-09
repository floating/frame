import cheerio from 'cheerio'
import log from 'electron-log'

import nebulaApi from '../../../nebula'
import store from '../../../store'
import getType from './getType'
import { ServerResponse } from 'http'

const nebula = nebulaApi()

function error(res: ServerResponse, code: number, message: string) {
  res.writeHead(code || 404)
  res.end(message)
}

function getCid(namehash: string): string {
  return store(`main.dapps`, namehash, `content`)
}

export default {
  stream: async (res: ServerResponse, namehash: string, path: string) => {
    // Stream assets from IPFS back to the client
    let found = false

    const cid = getCid(namehash)

    try {
      for await (const chunk of nebula.ipfs.cat(`${cid}${path}`)) {
        if (!found) {
          res.setHeader('content-type', getType(path))
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
          res.writeHead(200)

          found = true
        }

        res.write(chunk)
      }

      res.end()
    } catch (e) {
      // console.error('   ---   ' + e.message)
      error(res, 404, (e as NodeJS.ErrnoException).message)
    }

    // file.content.on('data', data => res.write(data))
    // file.content.once('end', () => res.end())
    // stream.on('data', file => {
    //   if (!file) return error(res, 404, 'Asset not found')
    //   res.setHeader('content-type', getType(path))
    //   res.setHeader('Access-Control-Allow-Origin', '*')
    //   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    //   res.writeHead(200)
    //   file.content.on('data', data => res.write(data))
    //   file.content.once('end', () => res.end())
    // })
    // stream.on('error', err => error(res, err.statusCode, `For security reasons, please launch this app from Frame\n\n(${err.message})`))
  },
  dapp: async (res: ServerResponse, namehash: string) => {
    // Resolve dapp via IPFS, inject functionality and send it back to the client
    // if (!ipfs return error(res, 404, 'IPFS client not running')
    const cid = store('main.dapps', namehash, 'content')

    try {
      const index = await nebula.ipfs.getFile(`${cid}/index.html`)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      const $ = cheerio.load(index)
      res.end($.html())
    } catch (e) {
      log.error('could not resolve dapp', (e as NodeJS.ErrnoException).message)
    }
  }
}

//   ipfs.get(`${cid}/index.html`, (err, files) => {
//     if (err) return error(res, 404, 'Could not resolve dapp: ' + err.message)
//     res.setHeader('Set-Cookie', [`__app=${app}`, `__session=${session}`])
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
//     res.writeHead(200)

//     let file = files[0].content.toString('utf8')

//     const $ = cheerio.load(file.toString('utf8'))
//     $('html').prepend(`
//       <script>
//         const initial = ${JSON.stringify(storage.get(cid) || {})}
//         ${inject}
//       </script>
//     `)
//     res.end($.html())
//   })
// }
