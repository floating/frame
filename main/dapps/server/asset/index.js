const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const ipfs = require('../../../ipfs')

const resolve = require('../resolve')
const storage = require('../storage')

const getType = require('./getType')

const inject = fs.readFileSync(path.resolve(__dirname, '../../../../bundle/inject.js'), 'utf8')

const error = (res, code, message) => {
  res.writeHead(code || 404)
  res.end(message)
}

module.exports = {
  stream: async (res, app, path) => { // Stream assets from IPFS back to the client
    let file
    const cid = await resolve.rootCid(app)

    try {
      file = await ipfs.getFile(`${cid}${path}`)
      if (!file) throw new Error('Asset not found')
    } catch (e) {
      // console.error('   ---   ' + e.message)
      error(res, 404, e.message)
    }

    if (file) {
      res.setHeader('content-type', getType(path))
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      res.writeHead(200)
      res.write(file.content)
      res.end()
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
  dapp: async (res, app, session) => { // Resolve dapp via IPFS, inject functionality and send it back to the client
    // if (!ipfs return error(res, 404, 'IPFS client not running')
    const cid = await resolve.rootCid(app)
    const index = await ipfs.getFile(`${cid}/index.html`)
    // res.setHeader('Set-Cookie', [`__app=${app}`, `__session=${session}`])
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.writeHead(200)
    const $ = cheerio.load(index.content.toString('utf8'))
    $('html').prepend(`
      <script>
        const initial = ${JSON.stringify(storage.get(cid) || {})}
        ${inject}
      </script>
    `)
    res.end($.html())
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
