import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import link from './link'

// import App from './App'

// import _store from './store'

// import DevTools from 'restore-devtools'
// <DevTools />

// const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { ready: false }
  }

  componentDidMount () {
    this.webview = document.createElement('webview')
    // if (this.current === this.id) this.webview.style.zIndex = 1250
    this.webview.className = 'view'
    // this.webview.setAttribute('backgroundThrottling', false)
    // this.webview.setAttribute('preload', path.join(__dirname, 'inject/index.js'))
    // this.webview.src = this.store('view.data', id, 'url')
    this.webview.src = this.props.location
    this.webwrap.appendChild(this.webview)
    this.webview.addEventListener('did-finish-load', () => {
      this.setState({ ready: true })
    })

    // this.webview.innerHTML = `<webview />`
    // this.view = this.webview.querySelector('webview')
    // this.view.loadURL()
  }

  render () {
    return (
      <div className='webwrap' style={{ opacity: this.state.ready ? 1 : 0 }} ref={ww => { this.webwrap = ww }} />
    )
  }
}

export default Restore.connect(App)

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

// const store = _store()

link.on('location', location => {
  console.log(location)
  document.title = location.ens
  const store = Restore.create({}, {})
  const Frame = Restore.connect(App, store)
  ReactDOM.render(<Frame location={location.url} />, document.getElementById('frame'))
})
