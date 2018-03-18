import React from 'react'
import Restore from 'react-restore'

class Settings extends React.Component {
  render () {
    return (
      <div className='settings'>
        <div className='settingsTitle'>{'Local Settings'}</div>
        <div className='settingsItems'>
          <div className='settingsItem'>
            {'Setting #1'}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
