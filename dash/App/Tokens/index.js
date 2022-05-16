import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import CustomTokens from '../Panel/Notify/CustomTokens'

class Tokens extends React.Component {
  render () {
    return (
      <CustomTokens />
    ) 
  }
}

export default Restore.connect(Tokens)
