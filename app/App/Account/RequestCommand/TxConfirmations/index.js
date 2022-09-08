import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'

class TxConfirmations extends React.Component {
  render () {
    const { req } = this.props
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0

    return (
      <div className='monitorConfirms'>
        {[...Array(12).keys()].map(i => {
          const monitorConfirmsItem = confirmations > i ? 'txProgressConfirmsItem txProgressConfirmsItemGood' : 'txProgressConfirmsItem'
          return <div key={i} className={monitorConfirmsItem}>{svg.arrowRight(11)}</div>
        })}
        </div>
    )
  }
}

export default Restore.connect(TxConfirmations)
