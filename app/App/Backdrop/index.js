import React from 'react'
import Restore from 'react-restore'

class Backdrop extends React.Component {
  getStyle () {
    const accountOpen = this.store('selected.open')
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (accountOpen && crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      if (req && req.type === 'transaction' && req.mode === 'monitor') {
        return ({
          overlay: {
            class: 'overlay overlayMonitor',
            style: {
              top: '140px',
              bottom: '140px'
            }
          },
          backdrop: {
            class: 'backdrop',
            style: {
              top: '140px',
              bottom: '140px'
            }
          }
        })
      }
      return ({
        overlay: {
          class: 'overlay',
          style: {
            top: '140px',
            bottom: '140px'
          }
        },
        backdrop: {
          class: 'backdrop',
          style: {
            top: '140px',
            bottom: '140px'
          }
        }
      })
    } else if (accountOpen) {
      return ({
        overlay: {
          class: 'overlay',
          style: {
            top: '140px',
            bottom: '40px'
          }
        },
        backdrop: {
          class: 'backdrop',
          style: {
            top: '140px',
            bottom: '40px'
          }
        }
      })
    } else {
      return ({
        overlay: {
          class: 'overlay',
          style: {
            top: '80px',
            bottom: '40px'
          }
        },
        backdrop: {
          class: 'backdrop',
          style: {
            top: '80px',
            bottom: '40px'
          }
        }
      })
    }
  }
  render () {
    const { overlay, backdrop } = this.getStyle()
    return (
      <>
        <div className={overlay.class} style={overlay.style} />
        <div className={backdrop.class} style={backdrop.style} />
      </>
    )
  }
}

export default Restore.connect(Backdrop)
