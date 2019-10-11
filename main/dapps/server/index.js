const fs = require('fs')
const path = require('path')
const http = require('http')
const cookie = require('cookie')
const qs = require('querystring')
const cheerio = require('cheerio')

const { userData } = require('../../util')

const asset = require('./asset')

const dapps = path.resolve(userData, 'dapps')

const handler = (req, res) => {
  const app = qs.parse(req.url.split('?')[1]).app
  if (app) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Set-Cookie', `_dapp=${app}`)
    fs.readFile(dapps + '/' + app + '/' + 'index.html', 'utf8', (err, html) => {
      if (err) return res.end('Error rendering dapp: ' + err.message)
      const root = cheerio.load(html)
      root('html').prepend(`
        <script>
          console.log('Frame Injection')
          var currentScript = document.currentScript || document.scripts[document.scripts.length - 1]
          currentScript.parentNode.removeChild(currentScript)
        </script>
      `)
      res.end(root.html())
    })
  } else {
    const dapp = req.headers.cookie ? cookie.parse(req.headers.cookie)._dapp : null
    const locator = req.url.split('?')[0].split('/').filter(o => ['', '.', '..'].indexOf(o) === -1)
    asset(res, dapps + '/' + dapp + '/' + locator.join('/'))
  }
}
http.createServer(handler).listen(8421, '127.0.0.1')
