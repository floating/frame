import React from 'react'
import Restore from 'react-restore'

class Backdrop extends React.Component {
  getStyle () {
    const accountOpen = this.store('selected.open')
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (accountOpen && crumb.view === 'requestView') {
      return ({
        top: '140px',
        bottom: '140px'
      })
    } else if (accountOpen) {
      return ({
        top: '140px',
        bottom: '40px'
      })
    }
  }
  render () {
    const style = this.getStyle()
    return (
      <>
        <div className='overlay' style={style} />
        <div className='backdrop' style={style} />
      </>
    )
  }
}

export default Restore.connect(Backdrop)
