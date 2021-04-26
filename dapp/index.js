// import svg from '../app/../resources/svg'
// import Native from './Native'

// link.on('location', location => {
//   updateDapp(location.dapp)
//   document.title = location.ens
//   // setColor(location.dapp.color)
//   //  document.body.style.color = color.text
//   // style={{ color: color ? color.text : 'none',  background: color ? color.bg : 'none' }}
// })

import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import App from './App'

import link from '../resources/link'
import _store from './store'



document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line


link.on('dapp', namehash => {
  link.rpc('getState', (err, state) => {
    if (err) return console.error('Could not get initial state from main.')
    const store = _store(state)
    const DappFrame = Restore.connect(App, store)
    ReactDOM.render(<DappFrame id={namehash} />, document.getElementById('frame'))
  })
})

document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
