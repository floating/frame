import React from 'react'
import Restore from 'react-restore'

import SignerPreview from './SignerPreview'

class Signer extends React.Component {
  render () {
    return <SignerPreview {...this.props} />
  }
}

export default Restore.connect(Signer)