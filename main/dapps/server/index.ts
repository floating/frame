import http from 'http'
import { URL } from 'url'
import cookie from 'cookie'
import { hash } from 'eth-ens-namehash'

import store from '../../store'

import sessions from './sessions'
import asset from './asset'

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const ens = url.hostname.replace('.localhost', '')
  const namehash = hash(ens)
  const session = req.headers.cookie ? cookie.parse(req.headers.cookie).__frameSession : ''

  // check if dapp is added before progressing
  if (!store('main.dapps', namehash)) {
    res.writeHead(404)
    return res.end('Dapp not installed')
  }

  if (sessions.verify(ens, session)) {
    return asset.stream(res, namehash, url.pathname)
  } else {
    res.writeHead(403)
    return res.end('No dapp session, launch this dapp from Frame')
  }
})

server.listen(8421, '127.0.0.1')

export default { sessions }
