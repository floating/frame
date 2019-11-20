import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import link from './link'
import svg from '../app/svg'

// import Native from './Native'
// import App from './App'
// import _store from './store'
// import DevTools from 'restore-devtools'
// <DevTools />
// const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }
// const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
// const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { ready: false }
  }

  componentDidMount () {
    this.webview = document.createElement('webview')
    this.webview.className = 'view'
    this.webview.src = this.props.location
    // this.webview.setAttribute('preload', './preload.js')
    this.webwrap.appendChild(this.webview)
    this.webview.addEventListener('did-finish-load', () => {
      this.setState({ ready: true })
      // setTimeout(() => {
      //   this.webview.openDevTools()
      // }, 1000)
      // this.webview.capturePage((err, img) => {
      //   console.log(err)
      //   const src = img.toDataURL()
      //   console.log(src)
      // })
      // setTimeout(() => {
      //   this.webview.capturePage().then(img => {
      //     // const i = img.toPNG()
      //     console.log('herer')
      //     console.log(img.toDataURL())
      //   }).catch(e => {
      //     console.log('ooo herer')
      //     console.log(e)
      //   })
      // }, 5000)

      // this.webview.executeJavaScript(`
      //   return {
      //     top: document.body.style.backgroundColor,
      //     one: document.body.firstChild.style.backgroundColor
      //   }
      // `).then(color => {
      //   console.log('Background color is', color)
      //   this.webview.openDevTools()
      //   this.setState({ ready: true })
      // }).catch(e => {
      //   console.error(e)
      // })
    })

    // this.webview.addEventListener('ipc-message', event => {
    //   // prints "ping"
    //   console.log(event.channel)
    // })
    // this.webview.addEventListener('message', e => {
    //   console.log('GOT A MESSAGE')
    //   console.log(unwrap(e.data))
    // })
    // setTimeout(() => {
    //   this.webview.openDevTools()
    // }, 1000)
    // if (this.current === this.id) this.webview.style.zIndex = 1250
    // this.webview.setAttribute('backgroundThrottling', false)
    // this.webview.setAttribute('preload', path.join(__dirname, 'inject/index.js'))
    // this.webview.src = this.store('view.data', id, 'url')
    // this.webview.addEventListener('did-finish-load', () => {
    //   this.setState({ ready: true })
    // })
    //
    // this.webview.innerHTML = `<webview />`
    // this.view = this.webview.querySelector('webview')
    // this.view.loadURL()
  }

  render () {
    return (
      <>
        <div className='backdrop' />
        <div className='top'>
          <div className='title'>
            {this.props.ens}
          </div>
          <div className='menu'>
            <div
              className='reload'
              onMouseDown={() => {
                this.setState({ ready: false })
                this.webview.reload()
              }}
            >
              {svg.reload(13)}
            </div>
          </div>
        </div>
        <div className='shade' />
        {!this.state.ready ? (
          <div className='webloading'>
            <img src={`http://localhost:8080/ipfs/${this.props.dapp.cid}/${this.props.dapp.icon}`} />
            <div className='loader' />
          </div>
        ) : null}
        <div className='webwrap' style={this.state.ready ? { display: 'block' } : { display: 'none' }} ref={ww => { this.webwrap = ww }} />
      </>
    )
  }
}

export default Restore.connect(App)

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.on('location', location => {
  document.title = location.ens
  const store = Restore.create({}, {})
  const Frame = Restore.connect(App, store)
  ReactDOM.render(<Frame dapp={location.dapp} location={location.url} ens={location.ens} />, document.getElementById('frame'))
})
