const fs = require('fs')

const types = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  ttf: 'application/font-sfnt',
  svg: 'image/svg+xml',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png'
}

module.exports = (res, path) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  const ext = path.substr(path.lastIndexOf('.') + 1)
  res.setHeader('content-type', types[ext] || 'text/plain')
  fs.readFile(path, (err, asset) => {
    if (err) {
      res.writeHead(404)
      res.end(asset, 'utf-8')
    } else {
      res.writeHead(200)
      res.end(asset, 'utf-8')
    }
  })
}
