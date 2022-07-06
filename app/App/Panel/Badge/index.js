import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'

class Bridge extends React.Component {
  render () {
    if (this.store('view.badge') === 'updateReady') {
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
    } else if (this.store('view.badge') === 'updateAvailable') {
      return (
        <div className='badge' style={{ transform: 'translateY(0px)', height: '224px' }}>
          <div className='badgeInner'>
            <div className='badgeMessage'>
              A new update is available, would you like to install it?
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner' onMouseDown={() => {
                    link.send('tray:installAvailableUpdate')
                    link.send('tray:dismissUpdate', true)
                  }}
                >Install Update
                </div>
              </div>
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner' onMouseDown={() => {
                    link.send('tray:dismissUpdate', true)
                  }}
                >Remind Me Later
                </div>
              </div>
            </div>
            <div className='badgeInput'>
              <div className='badgeInputButton'>
                <div
                  className='badgeInputInner badgeInputSmall' onMouseDown={() => {
                    link.send('tray:dismissUpdate', false)
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
