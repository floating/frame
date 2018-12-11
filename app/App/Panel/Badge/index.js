import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

class Bridge extends React.Component {
  badgeInner () {
    if (this.store('view.badge') === 'updateReady') {
      return (
        <div className='badgeInner'>
          <div className='badgeMessage'>
            {'Your update is ready and will be installed next restart'}
          </div>
          <div className='badgeInput'>
            <div className='badgeInputButton'>
              <div className='badgeInputButtonInner' onMouseDown={() => link.send('tray:updateRestart', false)}>{'Ok'}</div>
            </div>
            <div className='badgeInputButton'>
              <div className='badgeInputButtonInner' onMouseDown={() => link.send('tray:updateRestart', true)}>{'Restart'}</div>
            </div>
          </div>
        </div>
      )
    } else if (this.store('view.badge') === 'updateAvailable') {
      return (
        <div className='badgeInner'>
          <div className='badgeMessage'>
            {'An update is available, would you like to install it?'}
          </div>
          <div className='badgeInput'>
            <div className='badgeInputButton'>
              <div className='badgeInputButtonInner' onMouseDown={() => {
                link.send('tray:installAvailableUpdate', false)
              }}>{'No'}</div>
            </div>
            <div className='badgeInputButton'>
              <div className='badgeInputButtonInner' onMouseDown={() => {
                link.send('tray:installAvailableUpdate', true)
              }}>{'Yes'}</div>
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
  render () {
    return (
      <div className='badge' style={this.store('view.badge') ? { transform: 'translateY(0px)' } : {}}>
        {this.badgeInner()}
      </div>
    )
  }
}

export default Restore.connect(Bridge)
