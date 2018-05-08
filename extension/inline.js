/* globals */

const fs = require('fs')
const path = require('path')

let frame = fs.readFileSync(path.join(__dirname, 'build/frame.js')).toString()

let inject = `
  var frame = unescape("${escape(frame)}")
  try {
    let script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    // script.setAttribute('src', chrome.extension.getURL('frame.js'))
    script.innerText = frame
    // script.onload = function () { this.remove() }
    document.head ? document.head.prepend(script) : document.documentElement.prepend(script)
  } catch (e) {
    console.log(e)
  }
`

fs.writeFile(path.join(__dirname, 'build/inject.js'), inject, err => { if (err) return console.log(err) })
