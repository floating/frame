import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'

import svg from '../../../svg'

class Main extends React.Component {
  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }
  render () {
    let signers = this.store('signers')
    let current = this.store('signer.current')
    let scrollTop = this.store('signer.position.scrollTop')
    return (
      <div className={this.store('panel.view') !== 'default' ? 'main mainHidden' : 'main'}>
        <div id='panelScroll' style={current ? {overflow: 'hidden', pointerEvents: 'none'} : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? {overflow: 'visible'} : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? {marginTop: '-' + scrollTop + 'px'} : {}}>
              {Object.keys(signers).sort().map((id, i) => <Signer key={id} {...signers[id]} index={i} reportScroll={() => this.reportScroll()} />)}
              {Object.keys(signers).length === 0 ? <div className='noSigners'>
                {svg.logo(50)}
                {'No Signers Connected'}
              </div> : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
