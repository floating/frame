import http from 'http'
import { URL } from 'url'

import sessions from './sessions'
import asset from './asset'
import { hash } from 'eth-ens-namehash'

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const ens = url.hostname.replace('.localhost', '')
  const namehash = hash(ens)
  
  // check if dapp is added before progressing 
  // res.writeHead(403)
  // res.end('No dapp session, launch this dapp from Frame')
  if (url.pathname === '/') {
    return asset.dapp(res, namehash)
  } else {
    return asset.stream(res, namehash, url.pathname)
  }
  // const [app, session] = (url.searchParams.get('dapp') || '').split(':')
  // if (app && session) {
  //   if (sessions.verify(app, session)) return asset.dapp(res, app, session)
  // } else {
  //   const { __app, __session } = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
  //   if (sessions.verify(__app, __session)) return asset.stream(res, __app, url.pathname)
  // }
})

server.listen(8421, '127.0.0.1')

export default { sessions }
