import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import AddToken from './AddToken'
import CustomTokens from './CustomTokens'

const AddTokenForm = ({ store }) => {
  const activeChains = Object.values(store('main.networks.ethereum')).filter((chain) => chain.on)
  return <AddToken req={store('view.notifyData')} activeChains={activeChains}  />
}

function Tokens ({ data: { notify } }) {
  return (
    <>
      {notify === 'addToken' ? (
        <AddTokenForm store={this.store}  />
      ) : (
        <CustomTokens />
      )}
    </>
  )
}

export default Restore.connect(Tokens)
