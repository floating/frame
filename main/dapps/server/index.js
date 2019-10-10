const fs = require('fs')
const http = require('http')
const asset = require('./asset')
const cheerio = require('cheerio')
const path = require('path')
const { userData } = require('../../util')
const dapps = path.resolve(userData, 'dapps')
const cookie = require('cookie')

const handler = (req, res) => {
  const locator = req.url.split('/').filter(o => ['', '.', '..', '...', 'favicon.ico'].indexOf(o) === -1)
  if (locator.length === 0) {
    res.end('No dapp requested')
  } else if (locator.length === 1) {
    const app = locator[0]
    fs.readFile(dapps + '/' + app + '/' + 'index.html', 'utf8', (err, html) => {
      if (err) return res.end('Error rendering dapp: ' + err.message)
      const root = cheerio.load(html)
      root('html').prepend(`
        <script>
          console.log('Injected By Frame')
          document.cookie = "_dapp=${app}"
          var currentScript = document.currentScript || document.scripts[document.scripts.length - 1]
          currentScript.parentNode.removeChild(currentScript)
        </script>
      `)
      res.end(root.html())
    })
  } else {
    const app = cookie.parse(req.headers.cookie)._dapp
    if (locator[0] === app) locator.shift()
    asset(res, dapps + '/' + app + '/' + locator.join('/'))
  }
}
http.createServer(handler).listen(8421, '127.0.0.1')
