const fs = require('fs')
const fa = require('./fa.js')

let icons = []

Object.keys(fa).forEach((key) => {
  if (!fa[key].svg?.light) return
  const { svg, styles, label, search } = fa[key]
  const icon = {
    name: key,
    svg: svg.light,
    label,
    search: search.terms
  }
  if (!icon.svg.viewBox) return
  delete icon.svg.raw
  delete icon.svg.width
  delete icon.svg.height
  delete icon.svg.last_modified
  icons.push(icon)
})

icons = icons.sort((a, b) => a.name.localeCompare(b.name))

// Writing to a JSON file
fs.writeFileSync('./icons.json', JSON.stringify(icons, null, 2), 'utf-8')
