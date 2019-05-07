import React from 'react'
import Restore from 'react-restore'

import link from '../../../link'

class Launcher extends React.Component {
  handleKeyPress (e) {
    if (e.key === 'Enter') {
      link.rpc('launchBrowser', e.target.value, (err, res) => console.log(err, res))
    }
  }

  render () {
    return (
      <div className='launcher'>
        <input
          className='launcherInput'
          type='text'
          onKeyPress={this.handleKeyPress}
          placeholder='Enter IPFS hash or ENS name'
          // value='monkybrain.eth'
        />
      </div>
    )
  }
}

export default Restore.connect(Launcher)
