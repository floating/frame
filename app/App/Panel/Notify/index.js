import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import frameIcon from './FrameIcon.png'

class Notify extends React.Component {
  mainnet () {
    return (
      <div className='notifyBoxWrap'>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyFrameIcon'>
            <img src={frameIcon} />
          </div>
          <div className='notifyTitle'>
            Welcome to Frame!
          </div>
          <div className='notifySubtitle'>
            System-wide web3
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              Please read <span onMouseDown={() => { link.send('tray:openExternal', 'https://github.com/floating/frame/blob/master/LICENSE') }}>our license</span>, use at your own risk and verify transactions and account details on a signing device whenever possible.
            </div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton' onMouseDown={() => {
                link.send('tray:action', 'muteWelcomeWarning')
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Let's go!</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // rinkeby () {
  //   return (
  //     <div className='notifyBoxWrap' style={this.store('view.notify') === 'rinkeby' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
  //       <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
  //       <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
  //         <div className='notifyTitle'>
  //           Parity 💔 Rinkeby
  //         </div>
  //         <div className='notifyBody'>
  //           <div className='notifyBodyLine'>Unfortunately, Parity does not support the Rinkeby testnet.</div>
  //           <div className='notifyBodyLine'>Please select another Ethereum client or use the secondary connection.</div>
  //         </div>
  //         <div className='notifyInput'>
  //           <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
  //             <div className='notifyInputOptionText'>OK</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  // ipfsAlreadyRunning () {
  //   return (
  //     <div className='notifyBoxWrap' style={this.store('view.notify') === 'ipfsAlreadyRunning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
  //       <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
  //       <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
  //         <div className='notifyBody'>
  //           <div className='notifyBodyLine'>IPFS daemon is already running on this machine.</div>
  //         </div>
  //         <div className='notifyInput'>
  //           <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
  //             <div className='notifyInputOptionText'>Ok</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  // parityAlreadyRunning () {
  //   return (
  //     <div className='notifyBoxWrap' style={this.store('view.notify') === 'parityAlreadyRunning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
  //       <div className='notifyClose' onMouseDown={() => this.store.notify()}>{svg.octicon('x', { height: 18 })}</div>
  //       <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
  //         <div className='notifyBody'>
  //           <div className='notifyBodyLine'>Parity is already running on this machine.</div>
  //         </div>
  //         <div className='notifyInput'>
  //           <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
  //             <div className='notifyInputOptionText'>Ok</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  nonceWarning () {
    return (
      <div className='notifyBoxWrap'>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            Adjustable Nonce
          </div>
          <div className='notifyBody' style={{ padding: '20px 0px' }}>
            Adjusting the nonce of a replacement transaction will convert it to a new transaction, use with caution
          </div>
          <div className='notifyInput'>
            <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
              <div className='notifyInputOptionText'>Got it!</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  gasFeeWarning ({ req = {}, feeUSD = 0 }) {
    return (
      <div className='notifyBoxWrap'>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            Gas Fee Warning
          </div>
          <div className='notifyBody'>
            {feeUSD ? (
              <>
                <div className='notifyBodyLine'>The fee for this transaction is:</div>
                <div className='notifyBodyLine notifyBodyPrice'>{`${parseFloat(feeUSD).toFixed(2)} USD`}</div>
              </>
            ) : (
              <div className='notifyBodyLine'>We were unable to determine this transaction's fee in USD.</div>
            )}
            <div className='notifyBodyQuestion'>Are you sure you want to proceed?</div>
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
          <div className='notifyCheck' onMouseDown={() => link.send('tray:action', 'toggleGasFeeWarning')}>
            <div className='notifyCheckBox'>
              {this.store('main.mute.gasFeeWarning') ? svg.octicon('check', { height: 26 }) : null}
            </div>
            <div className='notifyCheckText'>
              {'Don\'t show this warning again'}
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
      <div className='notifyBoxWrap'>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            Open External Link
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

  openExplorer ({ hash }) {
    return (
      <div className='notifyBoxWrap'>
        <div className='notifyBox' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyTitle'>
            Open Block Explorer
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>Frame will open a block explorer in your browser for transaction:</div>
            <div className='notifyBodyHash'>{hash}</div>
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
                link.send('tray:openExplorer', hash)
                this.store.notify()
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
          <div
            className='notifyCheck' onMouseDown={() => {
              link.send('tray:action', 'toggleExplorerWarning')
            }}
          >
            <div className='notifyCheckBox'>
              {this.store('main.mute.explorerWarning') ? (
                svg.octicon('check', { height: 26 })
              ) : null}
            </div>
            <div className='notifyCheckText'>
              {'Don\'t show this warning again'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const notify = this.store('view.notify')
    if (notify === 'mainnet') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.mainnet()}
        </div>
      )
    } else if (notify === 'nonceWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.nonceWarning()}
        </div>
      )
    } else if (notify === 'gasFeeWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.gasFeeWarning(this.store('view.notifyData'))}
        </div>
      )
    } else if (notify === 'contractData') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.contractData()}
        </div>
      )
    } else if (notify === 'hotAccountWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.hotAccountWarning()}
        </div>
      )
    } else if (notify === 'hotSignerMismatch') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.hotSignerMismatch()}
        </div>
      )
    } else if (notify === 'openExternal') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.openExternal(this.store('view.notifyData'))}
        </div>
      )
    } else if (notify === 'openExplorer') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.openExplorer(this.store('view.notifyData'))}
        </div>
      )
    } else {
      return null
    }
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
//     name: 'openExplorer',
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
