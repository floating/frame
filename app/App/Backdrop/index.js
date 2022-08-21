import React from 'react'
import Restore from 'react-restore'
// import svg from '../../../resources/svg'
// import link from '../../../resources/link'

// import BigNumber from 'bignumber.js'
// import { usesBaseFee } from '../../../resources/domain/transaction'
// import { capitalize } from '../../../resources/utils'


class Backdrop extends React.Component {
  render () {
    const accountOpen = this.store('selected.open')
    const style = accountOpen ? {
      top: '160px',
      bottom: '40px'
    } : {}
    return (
      <>
        <div className='overlay' style={style} />
        <div className='backdrop' style={style} />
      </>
    )
  }
}

export default Restore.connect(Backdrop)
