const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    return res.end()
  }
  let locator = url.parse(req.url, true)
  let pathway = locator.path.split('?')[0]
  pathway = pathway.split('/')
  pathway = pathway.filter(entry => !(entry === '.' || entry === '..' || entry === ''))
  pathway = './' + pathway.join('/')
  // res.setHeader('Access-Control-Allow-Origin', '*')
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  let ext = pathway.slice((pathway.lastIndexOf('.') - 1 >>> 0) + 2)
  console.log(ext)
  let contentType = 'text/plain'
  if (ext === 'html') contentType = 'text/html'
  if (ext === 'css') contentType = 'text/css'
  if (ext === 'js') contentType = 'application/javascript'
  if (ext === 'ttf') contentType = 'application/font-sfnt'
  res.setHeader('content-type', contentType)
  let target = path.resolve(__dirname, pathway)
  console.log(target)
  fs.readFile(target, (err, asset) => {
    console.log(err, asset)
    if (err) {
      res.writeHead(404)
      res.end('Not Found', 'utf-8')
    } else {
      res.writeHead(200)
      res.end(asset, 'utf-8')
    }
  })
}

console.log('here')
var server = http.createServer(handler)
server.listen(3333, '0.0.0.0')
