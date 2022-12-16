const ejs = require('ejs')
const minimist = require('minimist')
const { readFileSync, writeFileSync } = require('fs')

const windows = ['tray', 'dash', 'dapp', 'onboard']

function capitalize(s) {
  if (!s) return s
  return s[0].toUpperCase() + s.substring(1).toLowerCase()
}

function compileHtml(isDev) {
  const source = readFileSync(`./renderer/index.ejs`).toString()

  windows.forEach((window) => {
    const compile = ejs.compile(source, {
      compileDebug: true,
      context: {
        isDev,
        window,
        windowTitle: capitalize(window)
      }
    })
    const compiled = compile()

    writeFileSync(`./renderer/${window}/index.html`, compiled)
  })
}

const { dev } = minimist(process.argv.slice(2))

compileHtml(dev)
