import React from 'react'
import Restore from 'react-restore'
import styled from 'styled-components'

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
        <StyledButton>{'A New Dawn'}</StyledButton>
      </div>
    )
  }
}

export default Restore.connect(App)
