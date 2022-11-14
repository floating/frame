import React from 'react'
import Restore from 'react-restore'

class Backdrop extends React.Component {
  // getStyle () {
  //   const accountOpen = this.store('selected.open')
  //   const crumb = this.store('windows.panel.nav')[0] || {}
  //   if (accountOpen && crumb.view === 'requestView') {
  //     const { accountId, requestId } = crumb.data
  //     const req = this.store('main.accounts', accountId, 'requests', requestId)
  //     // TODO: Move this to nav data
  //     if (req && req.type === 'transaction' && crumb.data.step !== 'confirm') {
  //       return ({
  //         overlay: {
  //           class: 'overlay',
  //           style: {
  //             top: '140px',
  //             bottom: '40px'
  //           }
  //         },
  //         backdrop: {
  //           class: 'backdrop',
  //           style: {
  //             top: '140px',
  //             bottom: '40px'
  //           }
  //         }
  //       })
  //     }
  //     return ({
  //       overlay: {
  //         class: 'overlay',
  //         style: {
  //           top: '140px',
  //           bottom: '200px'
  //         }
  //       },
  //       backdrop: {
  //         class: 'backdrop',
  //         style: {
  //           top: '140px',
  //           bottom: '200px'
  //         }
  //       }
  //     })
  //   } else if (accountOpen) {
  //     return ({
  //       overlay: {
  //         class: 'overlay',
  //         style: {
  //           top: '140px',
  //           bottom: '40px'
  //         }
  //       },
  //       backdrop: {
  //         class: 'backdrop',
  //         style: {
  //           top: '140px',
  //           bottom: '40px'
  //         }
  //       }
  //     })
  //   } else {
  //     return ({
  //       overlay: {
  //         class: 'overlay',
  //         style: {
  //           top: '80px',
  //           bottom: '40px'
  //         }
  //       },
  //       backdrop: {
  //         class: 'backdrop',
  //         style: {
  //           top: '80px',
  //           bottom: '40px'
  //         }
  //       }
  //     })
  //   }
  // }
  render () {
    const accountOpen = this.store('selected.open')
    const footerHeight = this.store('windows.panel.footer.height')
    const top = accountOpen ? '140px' : '80px'
    const bottom = footerHeight + 'px'
    return (
      <>
        <div className={'overlay'} style={{ top, bottom }} />
        <div className={'backdrop'} style={{ top, bottom }} />
      </>
    )
  }
}

export default Restore.connect(Backdrop)
