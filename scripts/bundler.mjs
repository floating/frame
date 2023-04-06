import { Parcel } from '@parcel/core'
import EventEmitter from 'events'
import url from 'node:url'

const port = 1234
const host = `http://localhost:${port}`

const bundler = new Parcel({
  defaultConfig: '@parcel/config-default',
  entries: [
    'app/tray/index.dev.html',
    'app/dash/index.dev.html',
    'app/dapp/index.dev.html',
    'app/onboard/index.dev.html',
    'app/notify/index.dev.html'
  ],
  env: {
    NODE_ENV: 'development'
  },
  serveOptions: {
    port
  },
  hmrOptions: {
    port
  }
})

const launchServer = async function () {
  const events = new EventEmitter()

  const watcher = await bundler.watch((err, event) => {
    if (err) {
      events.emit('error', err)
    }

    if (event.type === 'buildSuccess') {
      const bundles = event.bundleGraph.getBundles()
      console.log(`\x1b[1m\x1b[32m✨ Built ${bundles.length} bundles in ${event.buildTime}ms!`, '\x1b[0m')
    } else if (event.type === 'buildFailure') {
      console.error('\x1b[1m\x1b[31m🚨 Build failed!', '\x1b[0m')
      console.error(event.diagnostics)
    }
  })

  return { server: { ...watcher, on: events.emit.bind(events) }, host }
}

export default launchServer

if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  // the script was invoked directly
  launchServer()
}
