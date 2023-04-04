import React from 'react'
import Restore from 'react-restore'

import Gas from '../Monitor'

class _Aux extends React.Component {
  render() {
    const { data } = this.store('panel.nav')[0] || {}
    const aux = (data && data.aux) || {}
    if (aux.type === 'gas') {
      return (
        <div className='auxWrap cardShow'>
          <Gas id={1} />
        </div>
      )
    } else {
      return null
    }
  }
}

export default Restore.connect(_Aux)
