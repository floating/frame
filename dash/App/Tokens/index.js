import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import AddToken from './AddToken'
import CustomTokens from './CustomTokens'

const AddTokenForm = ({ store, data }) => {
  const activeChains = Object.values(store('main.networks.ethereum')).filter((chain) => chain.on)
  return <AddToken req={store('view.notifyData')} activeChains={activeChains} data={data} />
}

function Tokens ({ data }) {
  return (
    <>
      {data.notify === 'addToken' ? (
        <AddTokenForm store={this.store} data={data}  />
      ) : (
        <CustomTokens />
      )}
    </>
  )
}

export default Restore.connect(Tokens)
