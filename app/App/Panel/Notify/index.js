import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import BigNumber from 'bignumber.js'
import { usesBaseFee } from '../../../../main/transaction'

import frameIcon from './FrameIcon.png'

import AddChain from './AddChain'

const FEE_WARNING_THRESHOLD_USD = 50

const capitalize = s => s[0].toUpperCase() + s.slice(1)

class Notify extends React.Component {
  mainnet () {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
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

  betaDisclosure () {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='notifyBox'>
            <div className='notifyFrameIcon'>
              <img src={frameIcon} />
            </div>
            <div className='notifyTitle'>
              Frame v0.5-beta
            </div>
            <div className='notifyBody'>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                We are excited to welcome you to the next iteration of Frame!
              </div>
              <div className='notifyBodyBlock'>
                Be advised, this version of Frame is currently in "beta" and will update on a beta track
              </div>
              <div className='notifyBodyBlock'>
                Use hardware signers for high value accounts and verify all transaction and account details on your signing device
              </div>
              <div className='notifyBodyBlock'>
                <span>Read</span>
                <span 
                  className='notifyBodyLink'
                  onMouseDown={() => { link.send('tray:openExternal', 'https://github.com/floating/frame/blob/0.5/LICENSE') }}
                >
                  our license
                </span>
                <span>and use Frame at your own risk</span>
              </div>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                <div>Please give us your feedback!</div>
                <div 
                  className='notifyBodyLink' 
                  style={{marginTop: '20px'}}
                  onMouseDown={() => { link.send('tray:openExternal', 'https://frame.canny.io') }}
                >
                  feedback.frame.sh
                </div>
              </div>
            </div>
            <div className='notifyInput'>
              <div
                className='notifyInputOption notifyInputSingleButton' onMouseDown={() => {
                  link.send('tray:action', 'muteBetaDisclosure')
                  this.store.notify()
                }}
              >
                <div className='notifyInputOptionText notifyBetaGo'>Let's go!</div>
              </div>
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
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='notifyBox'>
            <div className='notifyTitle'>
              Adjustable Nonce
            </div>
            <div className='notifyBody'>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                <div>
                  Adjusting the nonce of a replacement transaction will cause it to become a new transaction rather than a replacement, use with caution
                </div>
              </div>
            </div>
            <div className='notifyInput'>
              <div className='notifyInputOption notifyInputSingleButton' onMouseDown={() => this.store.notify()}>
                <div className='notifyInputOptionText'>Got it!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  gasFeeWarning ({ req = {}, feeUSD = '0.00', currentSymbol = 'ETH' }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>
            Gas Fee Warning
          </div>
          <div className='notifyBody'>
            {feeUSD !== '0.00' ? (
              <>
                <div className='notifyBodyLine'>The max fee for this transaction is:</div>
                <div className='notifyBodyLine notifyBodyPrice'>{`≈ $${feeUSD} in ${currentSymbol}`}</div>
              </>
            ) : (
              <div className='notifyBodyLine'>We were unable to determine this transaction's fee in USD.</div>
            )}
            <div className='notifyBodyQuestion'>Are you sure you want to proceed?</div>
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

  signerLockedWarning ({ req = {} }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>
            Signer locked!
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyQuestion'>
              Please unlock this signer and try again
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

  noSignerWarning ({ req = {} }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>
            No Signer Attached!
          </div>
          <div className='notifyBody'>
              <div className='notifyBodyLine'>
                No signer attached for this account
              </div>
            <div className='notifyBodyQuestion'>
              Please attach a signer that can sign for this account
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

  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }

  signerCompatibilityWarning ({ req = {}, compatibility = {}, chain = {} }) {
    const { signer, tx, compatible } = compatibility
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>
            Signer Compatibility
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              {`Your ${capitalize(signer)} is not compatible with ${capitalize(tx)} ${tx === 'london' ? '(EIP-1559) ' : ''}transactions. Your transaction will be converted to a legacy transaction before signing.`}
            </div>
            {['lattice', 'ledger'].includes(signer) ? (
              <div className='notifyBodyUpdate'>
                {`Update your ${capitalize(signer)} to enable compatibility`}
              </div>
            ) : null}
            <div className='notifyBodyQuestion'>
              Do you want to proceed?
            </div>
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
                // TODO: Transacionns need a better flow to respond to mutiple notifications after hitting sign
                const layer = this.store('main.networks', chain.type, chain.id, 'layer')
                const nativeCurrency = this.store('main.networksMeta', chain.type, chain.id, 'nativeCurrency')
                const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
                const currentSymbol = this.store('main.networks', chain.type, chain.id, 'symbol') || '?'

                let maxFeePerGas, maxFee, maxFeeUSD

                if (usesBaseFee(req.data)) {
                  const gasLimit = BigNumber(req.data.gasLimit, 16)
                  maxFeePerGas = BigNumber(req.data.maxFeePerGas, 16)
                  maxFee = maxFeePerGas.multipliedBy(gasLimit)
                  maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
                } else {
                  const gasLimit = BigNumber(req.data.gasLimit, 16)
                  maxFeePerGas = BigNumber(req.data.gasPrice, 16)
                  maxFee = maxFeePerGas.multipliedBy(gasLimit)
                  maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
                }
                
                if ((maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00') && !this.store('main.mute.gasFeeWarning')) {
                  this.store.notify('gasFeeWarning', { req, feeUSD: this.toDisplayUSD(maxFeeUSD), currentSymbol })
                } else {
                  link.rpc('approveRequest', req, () => {})
                  this.store.notify()
                }
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
          <div className='notifyCheck' onMouseDown={() => link.send('tray:action', 'toggleSignerCompatibilityWarning')}>
            <div className='notifyCheckBox'>
              {this.store('main.mute.signerCompatibilityWarning') ? svg.octicon('check', { height: 26 }) : null}
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
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()} style={this.store('view.notify') === 'contractData' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox' >
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
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()} style={this.store('view.notify') === 'hotAccountWarning' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox'>
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
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()} style={this.store('view.notify') === 'hotSignerMismatch' ? { transform: 'translateX(calc(-100% - 100px))' } : {}}>
        <div className='notifyBox'>
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
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
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

  openExplorer ({ hash, chain }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
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
                link.send('tray:openExplorer', hash, chain)
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
    } else if (notify === 'betaDisclosure') {
      return (
        <div className='notify cardShow'>
          {this.betaDisclosure()}
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
    } else if (notify === 'noSignerWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.noSignerWarning(this.store('view.notifyData'))}
        </div>
      )
    } else if (notify === 'signerLockedWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.signerLockedWarning(this.store('view.notifyData'))}
        </div>
      )
    } else if (notify === 'signerCompatibilityWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          {this.signerCompatibilityWarning(this.store('view.notifyData'))}
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
    } else if (notify === 'addChain') {
      return (
        <div className='notify cardShow' onMouseDown={() => this.store.notify()}>
          <AddChain req={this.store('view.notifyData')} />
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
