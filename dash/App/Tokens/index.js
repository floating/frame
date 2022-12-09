import React from 'react'
import Restore from 'react-restore'

import AddToken from './AddToken'
import CustomTokens from './CustomTokens'

const AddTokenForm = ({ store, data }) => {
  return <AddToken req={store('view.notifyData')} data={data} />
}

function Tokens({ data }) {
  return (
    <>{data.notify === 'addToken' ? <AddTokenForm store={this.store} data={data} /> : <CustomTokens />}</>
  )
}

export default Restore.connect(Tokens)
