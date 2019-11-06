import React from 'react'
import Restore from 'react-restore'
// import svg from '../../svg'

import Panel from './Panel'
import Dock from './Dock'

// import DevTools from 'restore-devtools'
// <DevTools />

// const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

class App extends React.Component {
  render () {
    const open = this.store('tray.open')
    const transform = open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(430px, 0px, 0px)'
    // const expanded = this.store('dock.expand')
    // const selected = this.store('selected.open')
    // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    return (
      <div className='slider' style={{ transform }}>
        <Dock />
        <Panel />
      </div>
    )
  }
}

export default Restore.connect(App)
