import React from 'react'
import Restore from 'react-restore'
// import octicons from 'octicons'
// import svg from '../../svg'

import Signer from './Signer'

class Main extends React.Component {
  render () {
    let signers = this.store('signers')
    // let minimized = this.store('signer.minimized')
    let current = this.store('signer.current')
    return (
      <div className='main'>
        <div id='panelScroll'>
          <div id='panelSlide' style={current ? {overflow: 'hidden'} : {}}>
            <div id='panelWrap'>
              {signers.map((signer, i) => <Signer key={i} {...signer} index={i} mode={'scroll'} />)}
            </div>
          </div>
        </div>
        <div className='signersSlide' style={{display: current ? 'block' : 'none'}}>
          {signers.map((signer, i) => <Signer key={i} {...signer} index={i} mode={'slide'} />)}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
