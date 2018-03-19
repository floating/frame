import React from 'react'
import Restore from 'react-restore'

class Settings extends React.Component {
  render () {
    return (
      <div className='settings'>
        <div className='settingsTitle'>{'Local Settings'}</div>
        <div className='settingsItems'>
          <div className='settingsItem' onClick={_ => this.store.runLocalNode()}>
            {'Run local node? ' + this.store('local.node.run')}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
