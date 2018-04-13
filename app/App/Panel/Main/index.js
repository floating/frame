import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'

class Main extends React.Component {
  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }
  render () {
    let signers = this.store('signers')
    let current = this.store('signer.current')
    let scrollTop = this.store('signer.position.scrollTop')
    return (
      <div className='main'>
        <div id='panelScroll' style={current ? {overflow: 'hidden', pointerEvents: 'none'} : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? {overflow: 'visible'} : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? {marginTop: '-' + scrollTop + 'px'} : {}}>
              {signers.map((signer, i) => <Signer key={i} {...signer} index={i} reportScroll={() => this.reportScroll()} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
