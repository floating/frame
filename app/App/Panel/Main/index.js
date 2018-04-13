import React from 'react'
import Restore from 'react-restore'

import Signer from './Signer'

class Main extends React.Component {
  render () {
    let signers = this.store('signers')
    let current = this.store('signer.current')
    return (
      <div className='main'>
        <div id='panelScroll' style={current ? {overflow: 'hidden', pointerEvents: 'none'} : {}}>
          <div id='panelSlide' style={current ? {overflow: 'visible'} : {}}>
            <div id='panelWrap'>
              {signers.map((signer, i) => <Signer key={i} {...signer} index={i} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
