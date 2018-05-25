const fs = require('fs')
const path = require('path')

let inject = `
  var frame = unescape('${escape(fs.readFileSync(path.join(__dirname, '../build/extension/frame.js')).toString())}')
  try {
    let script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.innerText = frame
    script.onload = function () { this.remove() }
    document.head ? document.head.prepend(script) : document.documentElement.prepend(script)
  } catch (e) {
    console.log(e)
  }
`
fs.writeFile(path.join(__dirname, '../build/extension/inject.js'), inject, err => { if (err) throw err })
fs.unlink(path.join(__dirname, '../build/extension/frame.js'), err => { if (err) throw err })
fs.unlink(path.join(__dirname, '../build/extension/inline.js'), err => { if (err) throw err })
