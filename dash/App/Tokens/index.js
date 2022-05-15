import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'


class Tokens extends React.Component {
  render () {
    return (
      <div>{'Tokens'}</div>
    ) 
  }
}

export default Restore.connect(Tokens)
