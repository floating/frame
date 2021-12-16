import React from 'react'
import Restore from 'react-restore'
import svg from '../../../resources/svg'
import link from '../../../resources/link'

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {}
  }

  render () {
    return (
      <div className='dappTile'>
        <div className='dappIcon' onClick={() => {
          link.send('*:openDapp', this.props.ens)
        }}>
          {svg.ruby(26)}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)