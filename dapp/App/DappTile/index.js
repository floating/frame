import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {}
  }

  render() {
    return (
      <div className='dappTile'>
        <div
          className='dappIcon'
          onClick={() => {
            link.send('runDapp', this.props.ens)
          }}
        >
          {this.props.ens.substr(0, 3)}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
