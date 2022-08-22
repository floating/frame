import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../resources/svg'
// import link from '../../../resources/link'

// import BigNumber from 'bignumber.js'
// import { usesBaseFee } from '../../../resources/domain/transaction'
// import { capitalize } from '../../../resources/utils'


class Backdrop extends React.Component {
  getStyle () {

    const accountOpen = this.store('selected.open')
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (accountOpen && crumb.view === 'requestView') {
      return ({
        top: '160px',
        bottom: '140px'
      })
    } else if (accountOpen) {
      return ({
        top: '160px',
        bottom: '40px'
      })
    }
  }
  render () {
    const accountOpen = this.store('selected.open')
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
