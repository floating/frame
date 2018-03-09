const path = require('path')
const stylus = require('stylus')

const base = path.join(__dirname, '/index.styl')
let last = ''

const inject = () => {
  stylus(require('fs').readFileSync(base).toString()).set('filename', base).render((err, css) => {
    if (err) throw new Error(err)
    if (last !== css) {
      last = css
      let style = document.getElementById('style') || document.createElement('style')
      style.innerHTML = ''
      style.id = 'style'
      style.type = 'text/css'
      style.appendChild(document.createTextNode(css))
      document.head.appendChild(style)
    }
  })
}

inject()

if (process.env.NODE_ENV !== 'production') { // Update to file watcher
  setInterval(() => {
    inject()
  }, 500)
}
