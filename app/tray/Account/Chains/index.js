import React from 'react'
import Restore from 'react-restore'

import ChainsPreview from './ChainsPreview'

class Chains extends React.Component {
  render() {
    return <ChainsPreview {...this.props} />
  }
}

export default Restore.connect(Chains)
