import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'

class Bridge extends React.Component {
  render() {
    const badge = this.store('view.badge') || {}

    if (badge.type === 'updateReady') {
      return (
        <div className='badgeWrap'>
          <div className='badge cardShow' style={{ transform: 'translateY(0px)', height: '196px' }}>
            <div className='badgeInner'>
              <div className='badgeMessage'>Your update is ready, restart Frame to switch?</div>
              <div className='badgeInput'>
                <div className='badgeInputButton'>
                  <div
                    className='badgeInputInner'
                    onMouseDown={() => link.send('tray:updateRestart')}
                    style={{ color: 'var(--good)' }}
                  >
                    Restart Now
                  </div>
                </div>
              </div>
              <div className='badgeInput'>
                <div className='badgeInputButton'>
                  <div
                    className='badgeInputInner'
                    onMouseDown={() => link.send('tray:action', 'updateBadge', '')}
                    style={{ color: 'var(--moon)' }}
                  >
                    Restart Later
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (badge.type === 'updateAvailable') {
      return (
        <div className='badgeWrap'>
          <div className='badge cardShow' style={{ transform: 'translateY(0px)', height: '224px' }}>
            <div className='badgeInner'>
              <div className='badgeMessage'>
                Version {badge.version} is available, would you like to install it?
              </div>
              <div className='badgeInput'>
                <div className='badgeInputButton'>
                  <div
                    className='badgeInputInner'
                    onMouseDown={() => {
                      link.send('tray:installAvailableUpdate', badge.version)
                    }}
                    style={{ color: 'var(--good)' }}
                  >
                    Install Update
                  </div>
                </div>
              </div>
              <div className='badgeInput'>
                <div className='badgeInputButton'>
                  <div
                    className='badgeInputInner'
                    onMouseDown={() => {
                      link.send('tray:dismissUpdate', badge.version, true)
                    }}
                    style={{ color: 'var(--moon)' }}
                  >
                    Remind Me Later
                  </div>
                </div>
              </div>
              <div className='badgeInput'>
                <div className='badgeInputButton'>
                  <div
                    className='badgeInputInner badgeInputSmall'
                    onMouseDown={() => {
                      link.send('tray:dismissUpdate', badge.version, false)
                    }}
                  >
                    Skip This Version
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

export default Restore.connect(Bridge)
