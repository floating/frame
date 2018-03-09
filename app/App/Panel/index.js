import React from 'react'
import Restore from 'react-restore'

import svg from '../../svg'

import Signer from './Signer'
import Session from './Session'

class Panel extends React.Component {
  render () {
    let signers = this.store('signers')
    return (
      <div id='panel'>
        {this.store('frame.type') === 'window' ? <Session /> : null}
        <div id='panelScroll'>
          <div id='panelSlide'>
            <div id='panelWrap'>
              {signers.map((signer, i) => <Signer key={i} {...signer} index={i} />)}
              <div className='panelBot'>{svg.logo(50)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Panel)
