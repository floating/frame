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
          <div id='panelSlide'>
            <div id='panelWrap'>
              {signers.map((signer, i) => <Signer key={i} {...signer} index={i} mode={'scroll'} />)}
            </div>
          </div>
        </div>
        <div className='signersSlide' style={{display: current ? 'block' : 'none'}}>
          {signers.map((signer, i) => current === signer.id ? <Signer key={i} {...signer} index={i} mode={'slide'} /> : null)}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
