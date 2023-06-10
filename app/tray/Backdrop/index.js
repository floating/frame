import React from 'react'
import Restore from 'react-restore'

class Backdrop extends React.Component {
  render() {
    const footerHeight = this.store('windows.panel.footer.height')
    const top = '140px'
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
