import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import AddToken from './AddToken'
import CustomTokens from './CustomTokens'

class Tokens extends React.Component {
  render () {
    const { notify } = this.props.data
    const activeChains = Object.values(this.store('main.networks.ethereum')).filter((chain) => chain.on)
    
    return (
      <div>
        {notify === 'addToken' ? (
          <AddToken req={this.store('view.notifyData')} activeChains={activeChains}  />
        ) : (
          <CustomTokens />
        )}
      </div>
    ) 
  }
}

export default Restore.connect(Tokens)
