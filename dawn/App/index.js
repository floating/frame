import React from 'react'
import Restore from 'react-restore'

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {}
  }

  render() {
    return (
      <div className='dawn'>
        <h1>{'A New Dawn'}</h1>
      </div>
    )
  }
}

export default Restore.connect(App)