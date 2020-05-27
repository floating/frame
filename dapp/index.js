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

  render () {
    let dapp = this.store('dapp')
    let name = dapp ? dapp.domain : null
    if (name) {
      name = name.split('.')
      name.pop()
      name.reverse()
      name.forEach((v, i) => { name[i] = v.charAt(0).toUpperCase() + v.slice(1) })
      name = name.join(' ')
    }
    let background = dapp && dapp.color ? dapp.color.background : 'white'
    let color = dapp && dapp.color ? dapp.color.text : 'white'
    return (
      <div className='splash' style={{ background, color }}>
        <div className='top'>
          {dapp && dapp.color ? <div className='title'>{dapp.domain}</div> : null}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

// const setColor = color => {
//   if (color && color.bg) document.body.style.background = color.bg
//   if (color && color.text) document.body.style.color = color.text
// }

const store = Restore.create({
  dapp: {}
}, {
  updateDapp: (u, dapp) => {
    u('dapp', () => dapp)
  }
})

const Frame = Restore.connect(App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))

// link.on('location', location => {
//   updateDapp(location.dapp)
//   document.title = location.ens
//   // setColor(location.dapp.color)
//   //  document.body.style.color = color.text
//   // style={{ color: color ? color.text : 'none',  background: color ? color.bg : 'none' }}
// })

link.on('dapp', dapp => {
  document.title = dapp.ens
  store.updateDapp(dapp)
})