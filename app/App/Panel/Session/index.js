import React from 'react'
import Restore from 'react-restore'

class Session extends React.Component {
  render () {
    return (
      <div className='session' onMouseDown={() => { this.store.togglePanel() }}>Account One</div>
    )
  }
}

export default Restore.connect(Session)
