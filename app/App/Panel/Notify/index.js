import React from 'react'
import Restore from 'react-restore'
import svg from '../../../svg'
import link from '../../../link'

class Notify extends React.Component {
  intro () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'intro' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 22 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Getting Started'}
          </div>
          <div className='introInstructions'>
            <div className='introInstructionList'>
              <div>1. Connect your Ledger or Trezor</div>
              <div>2. Select a connected device to use</div>
              <div>3. Verify Frame is connected to Ethereum</div>
            </div>
            <div className='introInstructionItem' style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '17px', marginBottom: '5px' }}>Now Frame is ready to use!</div>
              <div>{'Visit'} <span onMouseDown={() => this.store.notify('openExternal', { url: 'https://frame.sh' })}>frame.sh</span> {'to try it out'}</div>
            </div>
            <div className='introInstructionItem' style={{ textAlign: 'center' }}>
              <div>{'If a dapp you\'re using does not automatically connect to Frame, use the'} <span onMouseDown={() => this.store.notify('openExternal', { url: 'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf' })}>browser extension</span></div>
            </div>
            <div className='introInstructionItem' style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', marginBottom: '5px' }}>Need help?</div>
              <div><span onMouseDown={() => this.store.notify('openExternal', { url: 'https://github.com/floating/frame/issues/new' })}>Open an issue</span> {'or'} <span onMouseDown={() => this.store.notify('openExternal', { url: 'https://gitter.im/framehq/general' })}>come chat with us</span></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  mainnet () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'mainnet' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Alpha Notice'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Frame is still in alpha, be cautious using alpha versions of Frame on the mainnet and verify all transactions and account details on your signing device.</div>
            <div className='notifyBodyLine'>Proceed only if you understand and accept these risks.</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton' onMouseDown={() => {
                link.send('tray:action', 'muteAlphaWarning')
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  rinkeby () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'rinkeby' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Parity 💔 Rinkeby'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Unfortunately, Parity does not support the Rinkeby testnet.</div>
            <div className='notifyBodyLine'>Please select another Ethereum client or use the secondary connection.</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  ipfsAlreadyRunning () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'ipfsAlreadyRunning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>IPFS daemon is already running on this machine.</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>Ok</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  parityAlreadyRunning () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'parityAlreadyRunning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Parity is already running on this machine.</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>Ok</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  gasFeeWarning ({ req = {}, feeUSD = 0 }) {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'gasFeeWarning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Gas Fee Warning'}
          </div>
          <div className='notifyBody'>
            {feeUSD ? (
              <div className='notifyBodyLine'>{`This transaction will cost ${parseFloat(feeUSD).toFixed(2)} USD in fees.`}</div>
            ) : (
              <div className='notifyBodyLine'>We were unable to determine this transaction's fee in USD.</div>
            )}
            <div className='notifyBodyLine'>Are you sure you want to proceed?</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny' onMouseDown={() => {
                link.rpc('declineRequest', req, () => {})
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed' onMouseDown={() => {
                link.rpc('approveRequest', req, () => {})
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  contractData () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'contractData' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            <div>Contract Data</div>
            <div>Not Allowed</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Your Ledger currently doesn't allow signing of contract data.</div>
            <div className='notifyBodyLine'>
              <span>To change this settings go to</span>
              <br />
              <span style={{ fontWeight: 'bold' }}>{'Settings > Contract Data'}</span>
              <br />
              <span>on your Ledger and select</span>
              <br />
              <span style={{ fontWeight: 'bold' }}>Yes</span>
            </div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => { this.store.notify() }}>
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  hotAccountWarning () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'hotAccountWarning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            <div>Hot Signer Alpha</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Frame hot signers are in alpha! Do not use them with high value accounts and verify your backups are valid. Only proceed if you understand and accept these risks.</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => { this.store.notify() }}>
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  hotSignerMismatch () {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'hotSignerMismatch' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            <div>Hot Signer Address Mismatch</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>The unlocked hot signer did not match the address shown in Frame and has been relocked.</div>
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => { this.store.notify() }}>
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  openExternal ({ url }) {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'openExternal' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Open External Link'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{`Frame will now open ${url} in your browser`}</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny' onMouseDown={() => {
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed' onMouseDown={() => {
                link.send('tray:openExternal', url)
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  openEtherscan ({ hash }) {
    return (
      <div className='notifyBoxWrap' style={this.store('view.notify') === 'openEtherscan' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            {'Open Etherscan'}
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>{`Frame will now open Etherscan for transaction ${hash} in your browser`}</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny' onMouseDown={() => {
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed' onMouseDown={() => {
                link.send('tray:openEtherscan', hash)
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () { // Instead of mounting all of these we should use a transition to mount and animate on demand
    return (
      <div className={this.store('view.notify') ? 'notify notifyOn' : 'notify'} onMouseDown={() => this.store.notify()}>
        {this.mainnet()}
        {this.gasFeeWarning(this.store('view.notifyData'))}
        {this.intro()}
        {this.rinkeby()}
        {this.openExternal(this.store('view.notifyData'))}
        {this.openEtherscan(this.store('view.notifyData'))}
        {this.ipfsAlreadyRunning()}
        {this.parityAlreadyRunning()}
        {this.contractData()}
        {this.hotAccountWarning()}
        {this.hotSignerMismatch()}
      </div>
    )
  }
}

// Notification Cycle for Testing

// intro
// contractData
// mainnet
// rinkeby
// ipfsAlreadyRunning
// parityAlreadyRunning
// gasFeeWarning
// contractData
// hotAccountWarning

// let notifications = [
//   {
//     name: 'intro',
//     data: {}
//   },
//   {
//     name: 'mainnet',
//     data: {}
//   },
//
//   {
//     name: 'rinkeby',
//     data: {}
//   },
//   {
//     name: 'ipfsAlreadyRunning',
//     data: {}
//   },
//   {
//     name: 'parityAlreadyRunning',
//     data: {}
//   },
//   {
//     name: 'gasFeeWarning',
//     data: {
//       req: {
//         handlerId: 'c9a46b23-dced-45a3-a961-cbc5b7873de5',
//         type: 'transaction',
//         data: {
//           value: '0x11e42f05714a67',
//           to: '0x355587247da36c3130da888d9f608ccf0d2351ce',
//           from: '0x355587247da36c3130da888d9f608ccf0d2351ce',
//           gasPrice: '0x3b9aca00',
//           gas: '0x5208',
//           chainId: '0x4'
//         },
//         payload: {
//           jsonrpc: '2.0',
//           id: 3416,
//           method: 'eth_sendTransaction',
//           params: [],
//           account: '0x355587247DA36C3130dA888d9F608ccF0D2351ce'
//         }
//       },
//       feeUSD: 200
//     }
//   },
//   {
//     name: 'contractData',
//     data: {}
//   },
//   {
//     name: 'openExternal',
//     data: {
//       url: 'https://frame.sh'
//     }
//   },
//   {
//     name: 'openEtherscan',
//     data: {
//       hash: '0x1234'
//     }
//   },
//   {
//     name: 'hotAccountWarning',
//     data: {}
//   }
// ]
//
//
// let i = -1
// const checkKey = (e) => {
//   if ((e || window.event).key === 'ArrowRight') {
//     i++
//     if (!notifications[i]) i = 0
//     console.log(notifications[i].name, notifications[i].data)
//     store.notify(notifications[i].name, notifications[i].data)
//   } else if ((e || window.event).key === 'ArrowLeft') {
//     i--
//     if (!notifications[i]) i = notifications.length - 1
//     console.log(notifications[i].name, notifications[i].data)
//     store.notify(notifications[i].name, notifications[i].data)
//   }
// }

// window.addEventListener('keyup', checkKey, true)

export default Restore.connect(Notify)
