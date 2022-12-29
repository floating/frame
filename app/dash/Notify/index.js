import React from 'react'
import Restore from 'react-restore'
import svg from '../../../resources/svg'
import link from '../../../resources/link'

import { BigNumber } from 'bignumber.js'
import { usesBaseFee } from '../../../resources/domain/transaction'

import Confirm from '../../../resources/Components/Confirm'
import AddToken from './AddToken'

const FEE_WARNING_THRESHOLD_USD = 50

const capitalize = (s) => s[0].toUpperCase() + s.slice(1)

class Notify extends React.Component {
  betaDisclosure() {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='notifyBox'>
            <div className='notifyFrameIcon'>
              <img src={frameIcon} />
            </div>
            <div className='notifyTitle'>Frame v0.5-beta</div>
            <div className='notifyBody'>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                We are excited to welcome you to the next iteration of Frame!
              </div>
              <div className='notifyBodyBlock'>
                Be advised, this version of Frame is currently in "beta" and will update on a beta track
              </div>
              <div className='notifyBodyBlock'>
                Use hardware signers for high value accounts and verify all transaction and account details on
                your signing device
              </div>
              <div className='notifyBodyBlock'>
                <span>Read</span>
                <span
                  className='notifyBodyLink'
                  onMouseDown={() => {
                    link.send('tray:openExternal', 'https://github.com/floating/frame/blob/0.5/LICENSE')
                  }}
                >
                  our license
                </span>
                <span>and use Frame at your own risk</span>
              </div>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                <div>Please give us your feedback!</div>
                <div
                  className='notifyBodyLink'
                  style={{ marginTop: '20px' }}
                  onMouseDown={() => {
                    link.send('tray:openExternal', 'https://frame.canny.io')
                  }}
                >
                  feedback.frame.sh
                </div>
              </div>
            </div>
            <div className='notifyInput'>
              <div
                className='notifyInputOption notifyInputSingleButton'
                onMouseDown={() => {
                  link.send('tray:action', 'muteBetaDisclosure')
                  link.send('tray:action', 'backDash')
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

  nonceWarning() {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='notifyBox'>
            <div className='notifyTitle'>Adjustable Nonce</div>
            <div className='notifyBody'>
              <div className='notifyBodyBlock notifyBodyBlockBig'>
                <div>
                  Adjusting the nonce of a replacement transaction will cause it to become a new transaction
                  rather than a replacement, use with caution
                </div>
              </div>
            </div>
            <div className='notifyInput'>
              <div
                className='notifyInputOption notifyInputSingleButton'
                onMouseDown={() => link.send('tray:action', 'backDash')}
              >
                <div className='notifyInputOptionText'>Got it!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  gasFeeWarning({ req = {}, feeUSD = '0.00', currentSymbol = 'ETH' }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>Gas Fee Warning</div>
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
              className='notifyInputOption notifyInputDeny'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed'
              onMouseDown={() => {
                link.rpc('approveRequest', req, () => {})
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
          <div className='notifyCheck' onMouseDown={() => link.send('tray:action', 'toggleGasFeeWarning')}>
            <div className='notifyCheckBox'>
              {this.store('main.mute.gasFeeWarning') ? svg.octicon('check', { height: 26 }) : null}
            </div>
            <div className='notifyCheckText'>{"Don't show this warning again"}</div>
          </div>
        </div>
      </div>
    )
  }

  signerUnavailableWarning({ req = {} }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>Signer unavailable for signing!</div>
          <div className='notifyBody'>
            <div className='notifyBodyQuestion'>Please check the signer for this account and try again</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  noSignerWarning({ req = {} }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>No Signer Attached!</div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>No signer attached for this account</div>
            <div className='notifyBodyQuestion'>Please attach a signer that can sign for this account</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  toDisplayUSD(bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }

  signerCompatibilityWarning({ req = {}, compatibility = {}, chain = {} }) {
    const { signer, tx, compatible } = compatibility
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>Signer Compatibility</div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              {`Your ${capitalize(signer)} is not compatible with ${capitalize(tx)} ${
                tx === 'london' ? '(EIP-1559) ' : ''
              }transactions. Your transaction will be converted to a legacy transaction before signing.`}
            </div>
            {['lattice', 'ledger'].includes(signer) ? (
              <div className='notifyBodyUpdate'>
                {`Update your ${capitalize(signer)} to enable compatibility`}
              </div>
            ) : null}
            <div className='notifyBodyQuestion'>Do you want to proceed?</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed'
              onMouseDown={() => {
                // TODO: Transacionns need a better flow to respond to mutiple notifications after hitting sign
                const isTestnet = this.store('main.networks', chain.type, chain.id, 'isTestnet')
                const {
                  nativeCurrency,
                  nativeCurrency: { symbol: currentSymbol = '?' }
                } = this.store('main.networksMeta', chain.type, chain.id)
                const nativeUSD =
                  nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0

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

                if (
                  (maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD ||
                    this.toDisplayUSD(maxFeeUSD) === '0.00') &&
                  !this.store('main.mute.gasFeeWarning')
                ) {
                  link.send('tray:action', 'navDash', {
                    view: 'notify',
                    data: {
                      notify: 'gasFeeWarning',
                      notifyData: { req, feeUSD: this.toDisplayUSD(maxFeeUSD), currentSymbol }
                    }
                  })
                } else {
                  link.rpc('approveRequest', req, () => {})
                  link.send('tray:action', 'backDash')
                }
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
          <div
            className='notifyCheck'
            onMouseDown={() => link.send('tray:action', 'toggleSignerCompatibilityWarning')}
          >
            <div className='notifyCheckBox'>
              {this.store('main.mute.signerCompatibilityWarning')
                ? svg.octicon('check', { height: 26 })
                : null}
            </div>
            <div className='notifyCheckText'>{"Don't show this warning again"}</div>
          </div>
        </div>
      </div>
    )
  }

  contractData() {
    return (
      <div
        className='notifyBoxWrap'
        onMouseDown={(e) => e.stopPropagation()}
        style={
          this.store('view.notify') === 'contractData' ? { transform: 'translateX(calc(-100% - 100px))' } : {}
        }
      >
        <div className='notifyBox'>
          <div className='notifyTitle'>
            <div>Contract Data</div>
            <div>Not Allowed</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              Your Ledger currently doesn't allow signing of contract data.
            </div>
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
            <div
              className='notifyInputOption notifyInputSingleButton'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  hotAccountWarning() {
    return (
      <div
        className='notifyBoxWrap'
        onMouseDown={(e) => e.stopPropagation()}
        style={
          this.store('view.notify') === 'hotAccountWarning'
            ? { transform: 'translateX(calc(-100% - 100px))' }
            : {}
        }
      >
        <div className='notifyBox'>
          <div className='notifyTitle'>
            <div>Hot Signer Alpha</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              Frame hot signers are in alpha! Do not use them with high value accounts and verify your backups
              are valid. Only proceed if you understand and accept these risks.
            </div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  hotSignerMismatch() {
    return (
      <div
        className='notifyBoxWrap'
        onMouseDown={(e) => e.stopPropagation()}
        style={
          this.store('view.notify') === 'hotSignerMismatch'
            ? { transform: 'translateX(calc(-100% - 100px))' }
            : {}
        }
      >
        <div className='notifyBox'>
          <div className='notifyTitle'>
            <div>Hot Signer Address Mismatch</div>
          </div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              The unlocked hot signer did not match the address shown in Frame and has been relocked.
            </div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputSingleButton'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>OK</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  openExternal({ url }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>Open External Link</div>
          <div className='notifyBody'>
            <div className='notifyBodyLineUrl'>{url}</div>
            <div className='notifyBodyLine'>{'Open Link in Browser?'}</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed'
              onMouseDown={() => {
                link.send('tray:openExternal', url)
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  openExplorer({ hash, chain }) {
    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='notifyTitle'>Open Block Explorer</div>
          <div className='notifyBody'>
            <div className='notifyBodyLine'>
              Frame will open a block explorer in your browser for transaction:
            </div>
            <div className='notifyBodyHash'>{hash}</div>
          </div>
          <div className='notifyInput'>
            <div
              className='notifyInputOption notifyInputDeny'
              onMouseDown={() => {
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Cancel</div>
            </div>
            <div
              className='notifyInputOption notifyInputProceed'
              onMouseDown={() => {
                link.send('tray:openExplorer', hash, chain)
                link.send('tray:action', 'backDash')
              }}
            >
              <div className='notifyInputOptionText'>Proceed</div>
            </div>
          </div>
          <div
            className='notifyCheck'
            onMouseDown={() => {
              link.send('tray:action', 'toggleExplorerWarning')
            }}
          >
            <div className='notifyCheckBox'>
              {this.store('main.mute.explorerWarning') ? svg.octicon('check', { height: 26 }) : null}
            </div>
            <div className='notifyCheckText'>{"Don't show this warning again"}</div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { notify, notifyData } = this.props.data
    if (notify === 'mainnet') {
      return (
        <div className='notify cardShow' onMouseDown={() => link.send('tray:action', 'backDash')}>
          {this.mainnet()}
        </div>
      )
    } else if (notify === 'betaDisclosure') {
      return <div className='notify cardShow'>{this.betaDisclosure()}</div>
    } else if (notify === 'nonceWarning') {
      return (
        <div className='notify cardShow' onMouseDown={() => link.send('tray:action', 'backDash')}>
          {this.nonceWarning()}
        </div>
      )
    } else if (notify === 'gasFeeWarning') {
      return <div className='notify cardShow'>{this.gasFeeWarning(notifyData)}</div>
    } else if (notify === 'noSignerWarning') {
      return <div className='notify cardShow'>{this.noSignerWarning(notifyData)}</div>
    } else if (notify === 'signerUnavailableWarning') {
      return <div className='notify cardShow'>{this.signerUnavailableWarning(notifyData)}</div>
    } else if (notify === 'signerCompatibilityWarning') {
      return <div className='notify cardShow'>{this.signerCompatibilityWarning(notifyData)}</div>
    } else if (notify === 'contractData') {
      return <div className='notify cardShow'>{this.contractData()}</div>
    } else if (notify === 'hotAccountWarning') {
      return <div className='notify cardShow'>{this.hotAccountWarning()}</div>
    } else if (notify === 'hotSignerMismatch') {
      return <div className='notify cardShow'>{this.hotSignerMismatch()}</div>
    } else if (notify === 'confirmRemoveChain') {
      const { chain } = notifyData

      const onAccept = () => {
        link.send('tray:action', 'removeNetwork', chain)

        // if accepted, go back twice to get back to the main chains panel
        link.send('tray:action', 'backDash', 2)
      }

      const onDecline = () => {
        link.send('tray:action', 'backDash')
      }

      return (
        <div className='notify cardShow'>
          <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
            <div className='notifyBoxSlide'>
              <Confirm
                prompt='Are you sure you want to remove this chain?'
                onAccept={onAccept}
                onDecline={onDecline}
              />
            </div>
          </div>
        </div>
      )
    } else if (notify === 'openExternal') {
      return <div className='notify cardShow'>{this.openExternal(notifyData)}</div>
    } else if (notify === 'openExplorer') {
      return <div className='notify cardShow'>{this.openExplorer(notifyData)}</div>
    } else if (notify === 'addToken') {
      return (
        <div className='notify cardShow'>
          <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
            <div className='notifyBoxSlide'>
              <AddToken {...notifyData} />
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

export default Restore.connect(Notify)
