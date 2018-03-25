import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

import svg from '../../svg'

import Signer from './Signer'
import Settings from './Settings'

// <Restore.DevTools />
// <div className='panelMenuItem'>{svg.logo(19)}</div>

class Panel extends React.Component {
  render () {
    let signers = this.store('signers')
    return (
      <div id='panel'>
        <div className='panelMenu'>
          <div className='panelMenuItem' onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['three-bars'].toSVG({height: 20})}} />
        </div>
        <div id='panelScroll'>
          <div id='panelSlide'>
            <div id='panelWrap'>
              {this.store('panel.view') === 'settings' ? (
                <Settings />
              ) : (
                signers.map((signer, i) => <Signer key={i} {...signer} index={i} />)
              )}
              <div className='panelBot'>{svg.logo(50)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Panel)
