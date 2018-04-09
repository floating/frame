import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

import svg from '../../svg'

import Main from './Main'
import Local from './Local'

// <div className='panelMenuItem'>{svg.logo(19)}</div>

class Panel extends React.Component {
  render () {
    return (
      <div id='panel'>
        <Restore.DevTools />
        <div className='panelMenu'>
          <div className='panelMenuItem' onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['three-bars'].toSVG({height: 20})}} />
        </div>
        {this.store('panel.view') === 'settings' ? <Local /> : <Main />}
        <div className='panelBot'>{svg.logo(50)}</div>
      </div>
    )
  }
}

export default Restore.connect(Panel)
