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
    return (
      <React.Fragment>
        <Dock />
        <Panel />
      </React.Fragment>
    )
  }
}

export default Restore.connect(App)
