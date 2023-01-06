import { Parcel } from '@parcel/core'
import EventEmitter from 'events'

const port = 1234
const host = `http://localhost:${port}`

const bundler = new Parcel({
  defaultConfig: '@parcel/config-default',
  entries: [
    'app/tray/index.dev.html',
    'app/dash/index.dev.html',
    'app/dapp/index.dev.html',
    'app/onboard/index.dev.html'
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

export default async function () {
  const events = new EventEmitter()

  await bundler.run()
  const watcher = await bundler.watch((err, event) => {
    if (err) {
      events.emit('error', err)
    }

    if (event.type === 'buildSuccess') {
      const bundles = event.bundleGraph.getBundles()
      console.log(`✨ Built ${bundles.length} bundles in ${event.buildTime}ms!`)
    } else if (event.type === 'buildFailure') {
      console.log(event.diagnostics)
    }
  })

  return { server: { ...watcher, on: events.emit.bind(events) }, host }
}
