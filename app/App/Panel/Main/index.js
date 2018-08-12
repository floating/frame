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
              {Object.keys(signers).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {'No Signers Connected'}
                  <div className='introInstructions'>
                    <div>{'Connect your Ledger/Trezor device'}</div>
                    <div>{'Selected a connected device to use'}</div>
                    <div>{'Confirm Frame is connected to Ethereum'}</div>
                    <div>{'Now Frame is ready to use!'}</div>
                    <div>{'Visit'} <a href='https://test.frame.sh'>{'test.frame.sh'}</a> {'to test it out'}</div>
                    <div>{'You will need Frame\'s'} <a href='https://frame.sh'>{'browser extension'}</a> {'if a dapp you\'re using does not connect to Frame automatically '}</div>
                  </div>
                  <span className='featureBox'>
                    <span className='featureBoxText'>
                      {`Frame Developer Release`}
                    </span>
                    <span className='featureBoxSubtext'>
                      {`Not recommended for mainnet use`}
                    </span>
                    <span className='featureBoxSubtext'>
                      {`mainnet release coming soon`}
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
