import React from 'react'

import ChainsPreview from './ChainsPreview'

type ChainsProps = {
  account: string
}

const Chains = ({ account }: ChainsProps) => {
  return <ChainsPreview account={account} />
}

export default Chains
