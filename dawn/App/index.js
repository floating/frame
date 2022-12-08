import React from 'react'
import Restore from 'react-restore'
import styled from 'styled-components'

import Native from '../../resources/Native'

const StyledButton = styled.button`
  color: blue;
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;
`

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {}
  }

  render() {
    return (
      <div className='dawn'>
        <div className='splash'>
          <Native />
          <div className='overlay' />
          <div className='mainLeft'></div>
          <div className='main'>
            <StyledButton>{'A New Dawn'}</StyledButton>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
