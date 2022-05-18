import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import AddToken from './AddToken'
import CustomTokens from './CustomTokens'

class Tokens extends React.Component {
  render () {
    const { notify } = this.props.data
    console.log('this.props', this.props)
    return (
      <div>
        {notify === 'addToken' ? (
          <AddToken />
        ) : (
          <CustomTokens />
        )}
      </div>
    ) 
  }
}

export default Restore.connect(Tokens)
