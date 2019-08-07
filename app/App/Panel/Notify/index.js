import React from 'react'
import Restore from 'react-restore'
import svg from '../../../svg'
import link from '../../../link'

class Notify extends React.Component {
  intro () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'intro' ? { left: '5px', right: '5px' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Getting Started'}
          </div>
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
        </div>
      </div>
    )
  }

  mainnet () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'mainnet' ? { left: '5px', right: '5px' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Alpha Notice'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{'Frame is still in alpha, be cautious using alpha versions of Frame on the mainnet and verify all transactions and account details on your signing device.'}</div>
            <div className='notifyBodyLine'>{'Proceeed only if you understand and accept these risks.'}</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputProceed' onMouseDown={() => {
              link.send('tray:action', 'alphaWarningPassed')
              this.store.notify()
            }}>
              <div className='notifyInputOptionText'>{'Proceed'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  rinkeby () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'rinkeby' ? { left: '5px', right: '5px' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Parity 💔 Rinkeby'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{'Unfortunately, Parity does not support the Rinkeby testnet.'}</div>
            <div className='notifyBodyLine'>{'Please select another Ethereum client or use the secondary connection.'}</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>{'Go Back'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  ipfsAlreadyRunning () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'ipfsAlreadyRunning' ? { left: '5px', right: '5px' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          {/* <div className='notifyTitle'>
            {'Could not start IPFS'}
          </div> */}
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{'IPFS daemon is already running on this machine.'}</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>{'Go Back'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  parityAlreadyRunning () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'parityAlreadyRunning' ? { left: '5px', right: '5px' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          {/* <div className='notifyTitle'>
            {'Could not start IPFS'}
          </div> */}
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{'Parity is already running on this machine.'}</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputDeny' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>{'Go Back'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className={this.store('view.notify') ? 'notify notifyOn' : 'notify'} onMouseDown={() => this.store.notify()}>
        {this.mainnet()}
        {this.intro()}
        {this.rinkeby()}
        {this.ipfsAlreadyRunning()}
        {this.parityAlreadyRunning()}
      </div>
    )
  }
}

export default Restore.connect(Notify)
