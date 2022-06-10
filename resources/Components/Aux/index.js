import React from 'react'
import Restore from 'react-restore'

import RingIcon from '../RingIcon'
// import chainMeta from '../../../../../resources/chainMeta'

// import link from '../../../../../resources/link'
import svg from '../../svg'

import Gas from '../Gas'

class _Aux extends React.Component {
  render () {
    const { data } = this.store('panel.nav')[0] || {}
    const aux = data && data.aux || {}
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
