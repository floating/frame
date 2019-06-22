import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'
import PendingSigner from './PendingSigner'
import Add from './Add'

import svg from '../../../svg'

class Main extends React.Component {
  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }
  render () {
    let accounts = this.store('main.accounts')
    let signers = this.store('main.signers')
    let untethered = Object.keys(signers).filter(id => Object.keys(accounts).indexOf(id) < 0)
    let current = this.store('selected.current')
    let scrollTop = this.store('selected.position.scrollTop')
    return (
      <div className={this.store('panel.view') !== 'default' ? 'main mainHidden' : 'main'}>
        <Add />
        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {untethered.sort().map((id, i) => <PendingSigner key={'signers' + id} {...this.store('main.signers', id)} index={i} />)}
              {Object.keys(accounts).sort().map((id, i) => <Signer key={id} {...accounts[id]} index={i} reportScroll={() => this.reportScroll()} />)}
              {Object.keys(accounts).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {'No Accounts Found'}
                  <span className='getStarted' onMouseDown={() => this.store.notify('intro')}>{'Need help getting started?'}</span>
                  <span className='featureBox'>
                    <span className='featureBoxText'>
                      {`FRAME ALPHA`}
                    </span>
                    <span className='featureBoxSubtext'>
                      {'v' + require('../../../../package.json').version}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
