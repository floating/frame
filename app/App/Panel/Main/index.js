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
    let signers = this.store('main.accounts')
    let current = this.store('selected.current')
    let scrollTop = this.store('selected.position.scrollTop')
    return (
      <div className={this.store('panel.view') !== 'default' ? 'main mainHidden' : 'main'}>
        <div className={this.store('view.addAccount') ? 'addAccountShade addAccountShadeActive' : 'addAccountShade'} />

        <div className={this.store('view.addAccount') ? 'addAccountInterface addAccountInterfaceActive' : 'addAccountInterface'}>
          <div className='panelBottomMenu'>
            <div className={this.store('view.addAccount') ? 'addAccountTrigger addAccountTriggerActive' : 'addAccountTrigger'} onMouseDown={() => this.store.toggleAddAccount()}>
              <div className='addAccountTriggerIcon'>{'+'}</div>
            </div>
          </div>
        </div>

        <div className={this.store('view.addAccount') ? 'addAccountMain addAccountMainActive' : 'addAccountMain'} >
          <div className='addAccountTitle'>{'Add or create a decentralized account you can use with any dapp!'}</div>
          <div className='addAccountHeader'>{'Hardware Accounts'}</div>
          <div className='addAccountItem addAccountItemHardware'>{'Ledger'}</div>
          <div className='addAccountItem addAccountItemHardware'>{'Trezor'}</div>
          <div className='addAccountHeader'>{'Hot Accounts'}</div>
          <div className='addAccountItem addAccountItemHot'>{'Phrase'}</div>
          <div className='addAccountItem addAccountItemHot'>{'Keyring'}</div>
          <div className='addAccountHeader'>{'Smart Accounts'}</div>
          <div className='addAccountItem addAccountItemSmart'>{'Aragon'}</div>
        </div>

        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {Object.keys(signers).sort().map((id, i) => <Signer key={id} {...signers[id]} index={i} reportScroll={() => this.reportScroll()} />)}
              {Object.keys(signers).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {'No Signers Connected'}
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
