import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

// import svg from '../../svg'

import Main from './Main'
import Local from './Local'

// <div className='panelMenuItem'>{svg.logo(19)}</div>
// <Restore.DevTools />

class Panel extends React.Component {
  render () {
    return (
      <div id='panel'>

        <div className='panelMenu'>
          <div className='panelMenuItem' onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['three-bars'].toSVG({height: 20})}} />
        </div>
        <Local />
        <Main />
      </div>
    )
  }
}

export default Restore.connect(Panel)
