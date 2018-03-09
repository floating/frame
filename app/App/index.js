import React from 'react'

import Title from './Title'
import Tabs from './Tabs'
import Navigation from './Navigation'
import Panel from './Panel'

class App extends React.Component {
  componentDidMount () {
    window.onkeydown = e => {
      if (e.metaKey && e.key === 't') {
        this.store.newView()
        e.preventDefault()
      }
    }
  }
  render () {
    return (
      <div>
        <Title />
        <Tabs />
        <Navigation />
        <div id='drop' />
        <div id='panelPush'>
          <Panel />
        </div>
      </div>
    )
  }
}

export default App
