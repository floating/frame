import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'

class Bridge extends React.Component {
  render () {
    const badge = this.store('view.badge') || {}

    if (badge.type === 'updateReady') {
      return (
        <div className='badge' style={{ transform: 'translateY(0px)', height: '196px' }}>
          <div className='badgeInner'>
            <div className='badgeMessage'>
              Your update is ready and will be installed next restart
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div className='badgeInputInner' onMouseDown={() => this.store.updateBadge()}>Ok</div>
              </div>
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div className='badgeInputInner' onMouseDown={() => link.send('tray:updateRestart')}>Restart Now</div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (badge.type === 'updateAvailable') {
      return (
        <div className='badge' style={{ transform: 'translateY(0px)', height: '224px' }}>
          <div className='badgeInner'>
            <div className='badgeMessage'>
              Version {badge.version} is available, would you like to install it?
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner' onMouseDown={() => {
                    link.send('tray:installAvailableUpdate', badge.version)
                  }}
                >Install Update
                </div>
              </div>
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner' onMouseDown={() => {
                    link.send('tray:dismissUpdate', badge.version, true)
                  }}
                >Remind Me Later
                </div>
              </div>
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner badgeInputSmall' onMouseDown={() => {
                    link.send('tray:dismissUpdate', badge.version, false)
                  }}
                >Skip This Version
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return <div className='badge' />
    }
  }
}

export default Restore.connect(Bridge)
