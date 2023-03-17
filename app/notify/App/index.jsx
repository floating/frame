import React from 'react'
import Restore from 'react-restore'

import Native from '../../../resources/Native'

import { Onboard } from './styled'

import Slides from './Slides'

class App extends React.Component {
  render() {
    return (
      <Onboard>
        <Native />
        <div className='frameOverlay' />
        <Slides platform={this.store('platform')} />
      </Onboard>
    )
  }
}
export default Restore.connect(App)
