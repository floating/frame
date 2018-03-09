import path from 'path'
import { ipcRenderer } from 'electron'

import provider from '../provider'
import store from '../store'

class Webview {
  constructor (id) {
    this.id = id
    this.store = store
    this.provider = provider
    this.current = this.store('view.current')

    // Create Webview
    this.webview = document.createElement('webview')
    if (this.current === this.id) this.webview.style.zIndex = 1250
    this.webview.className = 'view'
    this.webview.setAttribute('backgroundThrottling', false)
    this.webview.setAttribute('preload', path.join(__dirname, 'inject/index.js'))
    this.webview.src = this.store('view.data', id, 'url')

    // Bind to Webview Events
    this.webview.addEventListener('did-finish-load', this.initialLoad)
    this.webview.addEventListener('did-navigate', this.didNavigate.bind(this, {inPage: false}))
    this.webview.addEventListener('did-navigate-in-page', this.didNavigate.bind(this, {inPage: true}))
    this.webview.addEventListener('page-title-updated', this.titleUpdated.bind(this))
    this.webview.addEventListener('ipc-message', this.ipcMessage)

    // Add Webview to Window
    document.getElementById('views').appendChild(this.webview)

    store.events.on('injectWeb3', _ => {
      if (this.current === this.id) {
        this.webview.executeJavaScript(`
          window.requestProvider((err, provider) => {
            if (err) throw new Error(err)
            let Web3 = window.requestProvider.Web3
            window.web3 = new Web3(provider)
          })
        `)
      }
    })
  }
  ipcMessage = e => {
    if (e.channel === 'dapp:provider') {
      // let host = (new URL(this.webview.getURL())).host // Check Permissions
      let id = e.args[0]
      let payload = JSON.parse(e.args[1])
      this.provider.sendAsync(payload, (err, res) => {
        this.webview.send('frame:provider', JSON.stringify(id), JSON.stringify(err), JSON.stringify(res))
      })
    }
    if (e.channel === 'dapp:requestProvider') {
      let handlerId = e.args[0]
      this.webview.send('frame:requestProvider', handlerId, null, true)
    }
  }
  initialLoad = () => {
    this.webview.removeEventListener('did-finish-load', this.initialLoad)
    this.store.updateTitle(this.id, this.webview.getTitle())
    this.store.observer(_ => {
      this.current = this.store('view.current')
      this.current === this.id ? this.show() : this.hide()
    })
  }
  didNavigate ({inPage}, e) {
    this.store.updateUrl(this.id, e.url)
  }
  titleUpdated (e) {
    this.store.updateTitle(this.id, e.title)
  }
  hide () {
    this.webview.style.zIndex = 1150
    this.webview.style.visibility = 'hidden'
  }
  show () {
    this.webview.style.zIndex = 1250
    this.webview.style.visibility = 'visible'
  }
  close () {
    this.store.removeView(this.id, this.current === this.id)
    this.webview.remove()
  }
}

export default () => {
  const views = {}
  store.observer(_ => store('view.list').forEach(id => { if (!views[id]) views[id] = new Webview(id) }))
  store.events.on('loadURL', url => views[store('view.current')].webview.loadURL(url))
  store.events.on('closeView', id => {
    if (views[id]) views[id].close()
    if (store('view.list').length === 0) return ipcRenderer.send('customClose')
  })
  return {} // api
}
