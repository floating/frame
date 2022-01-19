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

link.rpc('getFrameId', (err, frameId) => {
  if (err) return console.error('Could not get frameId from main', err)
  window.frameId = frameId
  link.rpc('getState', (err, state) => {
    if (err) return console.error('Could not get initial state from main')
    const store = _store(state)
    window.store = store
    store.observer(() => {
      document.body.className = 'clip ' + store('main.colorway')
      setTimeout(() => {
        document.body.className = store('main.colorway')
      }, 100)
    })
    const DappFrame = Restore.connect(App, store)
    ReactDOM.render(<DappFrame />, document.getElementById('frame'))
  })
})

document.addEventListener('contextmenu', e => link.send('*:contextmenu', e.clientX, e.clientY))
