import React from 'react'
import Restore from 'react-restore'

import Native from '../../../resources/Native'

import { Onboard, Container } from './styled'

import Slides from './Slides'

class App extends React.Component {
  render() {
    return (
      <Onboard>
        <Native />
        <div className='frameOverlay' />
        <Container>
          <Slides platform={this.store('platform')} />
        </Container>
      </Onboard>
    )
  }
}
export default Restore.connect(App)
