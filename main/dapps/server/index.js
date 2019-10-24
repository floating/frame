const http = require('http')
const cookie = require('cookie')

const sessions = require('./sessions')
const asset = require('./asset')
const ws = require('./ws')
// const resolve = require('./resolve')

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const [app, session] = (url.searchParams.get('dapp') || '').split(':')
  if (app && session) {
    // const app = resolve.app(url.toString())
    if (sessions.verify(app, session)) return asset.dapp(res, app, session)
  } else {
    const { __app, __session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
    if (sessions.verify(__app, __session)) return asset.stream(res, __app, url.pathname)
  }
  res.writeHead(403)
  res.end('No dapp session, launch this dapp from Frame')
})

// const { __app, __session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
// const session = url.searchParams.get('session')
// console.log('\n\nreferer', req.headers.referer)
// if (req.headers.referer) { // Request from dapp for asset
//   const app = resolve.app(req.headers.referer)
//   if (sessions.verify(app, session)) return asset.stream(res, app, url.pathname)
// } else { // Request from Frame to resolve dapp
//   console.log(url.searchParams.get('session'))
//   console.log(req.headers.cookie ? cookie.parse(req.headers.cookie).__session : '')
//   const session = url.searchParams.get('session') || __session
//   const app = resolve.app(url.toString())
//   if (sessions.verify(app, session)) return asset.dapp(res, app, session)
// }
//   if (req.headers.referer) { // Request from dapp for asset
//     const session = req.headers.cookie ? cookie.parse(req.headers.cookie).__session : ''
//     const app = resolve.app(req.headers.referer)
//     const hash = resolve.hash(app)
//     if (sessions.verify(hash, session)) return asset.stream(res, app, req.url.split('?')[0])
//   } else { // Request from Frame to resolve dapp
//     const { session } = qs.parse(req.url.split('?')[1])
//     const app = resolve.app()
//     const hash = resolve.hash(app)
//     if (hash && sessions.verify(hash, session)) return asset.dapp(res, app, hash, session)
//   }
//
// })

ws(server).listen(8421, '127.0.0.1')

module.exports = { sessions }
