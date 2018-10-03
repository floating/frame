import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'

import svg from '../../../svg'
import link from '../../../link'

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
        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {Object.keys(signers).sort().map((id, i) => <Signer key={id} {...signers[id]} index={i} reportScroll={() => this.reportScroll()} />)}
              {Object.keys(signers).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {'No Signers Connected'}
                  <div className='introInstructions'>
                    <div className='introInstructionList'>
                      <div>{'1. Connect your Ledger or Trezor'}</div>
                      <div>{'2. Select a connected device to use'}</div>
                      <div>{'3. Verify Frame is connected to Ethereum'}</div>
                    </div>
                    <div className='introInstructionItem' style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '17px', marginBottom: '5px' }}>{'Now Frame is ready to use!'}</div>
                      <div>{'Visit'} <span onMouseDown={() => link.send('tray:openExternal', 'https://frame.sh')}>{'frame.sh'}</span> {'to try it out'}</div>
                    </div>
                    <div className='introInstructionItem' style={{ textAlign: 'center' }}>
                      <div>{'If a dapp you\'re using does not automatically connect to Frame, use the'} <span onMouseDown={() => link.send('tray:openExternal', 'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf')}>{'browser extension'}</span></div>
                    </div>
                    <div className='introInstructionItem' style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', marginBottom: '5px' }}>{'Need help?'}</div>
                      <div><span onMouseDown={() => link.send('tray:openExternal', 'https://github.com/floating/frame/issues/new')}>{'Open an issue'}</span> {'or'} <span onMouseDown={() => link.send('tray:openExternal', 'https://gitter.im/framehq/general')}>{'come chat with us'}</span></div>
                    </div>
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
