import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'

import Account from './Account'
import TxBar from './TxBar'
import TxConfirmations from './TxConfirmations'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

import { usesBaseFee } from '../../../resources/domain/transaction'

const FEE_WARNING_THRESHOLD_USD = 50

class Time extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      time: Date.now()
    }
    setInterval(() => {
      this.setState({ time: Date.now() })
    }, 1000)
  }

  msToTime (duration) {
    const seconds = Math.floor((duration / 1000) % 60)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    let label = ''
    let time = ''
    if (hours) {
      label = hours === 1 ? 'hour ago' : 'hours ago'
      time = hours
    } else if (minutes) {
      label = minutes === 1 ? 'minute ago' : 'minutes ago'
      time = minutes
    } else {
      label = 'seconds ago'
      time = seconds
    }
    return { time, label }
  }

  render () {
    const { time, label } = this.msToTime(this.state.time - this.props.time)
    return (
      <div className='txProgressSuccessItem txProgressSuccessItemRight'>
        <div className='txProgressSuccessItemValue'>
          {time}
        </div>
        <div className='txProgressSuccessItemLabel'>
          {label}
        </div>
      </div>
    )
  }
}

// import Filter from '../../Components/Filter'

let firstScroll = true

class _RequestApprove extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = { allowInput: false, dataView: false }

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }

  decline (req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }

  sentStatus () {
    const { req } = this.props
    const { notice, status, mode } = req

    const toAddress = (req.data && req.data.to) || ''
    let requestClass = 'signerRequest'

    // if (mode === 'monitor') requestClass += ' signerRequestMonitor'

    const success = (req.status === 'confirming' || req.status === 'confirmed')
    const error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'

    const chain = { 
      type: 'ethereum', 
      id: parseInt(req.data.chainId, 'hex')
    }

    const layer = this.store('main.networks', chain.type, chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', chain.type, chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    // const value = this.hexToDisplayValue(req.data.value || '0x')
    const currentSymbol = this.store('main.networks', chain.type, chain.id, 'symbol') || '?'

    const gasLimit = BigNumber(req.data.gasLimit, 16)
    const maxFeePerGas = BigNumber(usesBaseFee(req.data) ? req.data.maxFeePerGas : req.data.gasPrice, 16) 
    const maxFee = maxFeePerGas.multipliedBy(gasLimit)
    const maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)

    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'

    let feeAtTime = '?.??'

    if (req && req.tx && req.tx.receipt && nativeUSD) {
      const { gasUsed, effectiveGasPrice } = req.tx.receipt
      const { type, gasPrice } = req.data

      const paidGas = effectiveGasPrice || (parseInt(type) < 2 ? gasPrice : null)

      if (paidGas) {
        const feeInWei = parseInt(gasUsed, 'hex') * parseInt(paidGas, 'hex')
        const feeInEth = feeInWei / 1e18
        const feeInUsd = feeInEth * nativeUSD
        feeAtTime = (Math.round(feeInUsd * 100) / 100).toFixed(2)
      }
    }

    let displayStatus = req.status
    if (displayStatus === 'verifying') displayStatus = 'waiting for block'

    return (
      <>
        <div className={(req && req.tx && req.tx.hash) ? 'requestFooter requestFooterActive' : 'requestFooter'}>
          <div className='txActionButtons'
            onMouseLeave={() => {
              this.setState({ showHashDetails: false })
            }}
          >
            {(req && req.tx && req.tx.hash) ? 
              this.state.txHashCopied ? (
                <div className='txActionButtonsRow'>
                  <div
                    className={'txActionText'}
                  >
                    Transaction Hash Copied
                  </div>
                </div>
              ) : (
              this.state.showHashDetails || status === 'confirming' ? (
                <div className='txActionButtonsRow'>
                  <div
                    className={'txActionButton'}
                    onClick={() => {
                      if (req && req.tx && req.tx.hash) {
                        if (this.store('main.mute.explorerWarning')) {
                          link.send('tray:openExplorer', req.tx.hash, chain)
                        } else {
                          this.store.notify('openExplorer', { hash: req.tx.hash, chain: chain })
                        }
                      }
                    }}
                  >
                    Open Explorer
                  </div>
                  <div
                    className={'txActionButton'}
                    onClick={() => {
                      if (req && req.tx && req.tx.hash) {
                        link.send('tray:copyTxHash', req.tx.hash)
                        this.setState({ txHashCopied: true, showHashDetails: false })
                        setTimeout(() => {
                          this.setState({ txHashCopied: false })
                        }, 3000)
                      }
                    }}
                  >
                    Copy Hash
                  </div>
                </div>
              ) : (
                <div className='txActionButtonsRow'>
                  <div 
                    className='txActionButton txActionButtonBad'
                    onClick={() => {
                      link.send('tray:replaceTx', req.handlerId, 'cancel')
                    }}
                  >
                    Cancel
                  </div>
                  <div
                    className={'txActionButton'}
                    onClick={() => {
                      this.setState({ showHashDetails: true })
                    }}
                  >
                    View Details
                  </div>
                  <div 
                    className='txActionButton txActionButtonGood' 
                    onClick={() => {
                      link.send('tray:replaceTx', req.handlerId, 'speed')
                    }}
                  >
                    Speed Up
                  </div>
                </div>
              ) 
            ) : null}
          </div>
        </div>
        <div className={success ? 'txProgressSuccess' : 'txProgressSuccess txProgressHidden'}>
          {req && req.tx && req.tx.receipt ? (
            <>
              <div className='txProgressSuccessItem txProgressSuccessItemLeft'>
                <div className='txProgressSuccessItemLabel'>
                  In Block
                </div>
                <div className='txProgressSuccessItemValue'>
                  {parseInt(req.tx.receipt.blockNumber, 'hex')}
                </div>
              </div>
              <Time time={req.completed} />
              <div className='txProgressSuccessItem txProgressSuccessItemCenter'>
                <div className='txProgressSuccessItemLabel'>
                  Fee
                </div>
                <div className='txProgressSuccessItemValue'>
                  <div style={{ margin: '0px 1px 0px 0px', fontSize: '10px' }}>$</div>
                  {feeAtTime || '?.??'}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <div className={'requestNoticeInnerText'}>
          {displayStatus}
        </div>
      </>
    )
  }

  signOrDecline () {
    const { req } = this.props
    const { notice, status, mode } = req
    

    const toAddress = (req.data && req.data.to) || ''
    let requestClass = 'signerRequest'

    // if (mode === 'monitor') requestClass += ' signerRequestMonitor'

    const success = (req.status === 'confirming' || req.status === 'confirmed')
    const error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'

    const chain = { 
      type: 'ethereum', 
      id: parseInt(req.data.chainId, 'hex')
    }

    const layer = this.store('main.networks', chain.type, chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', chain.type, chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    // const value = this.hexToDisplayValue(req.data.value || '0x')
    const currentSymbol = this.store('main.networks', chain.type, chain.id, 'symbol') || '?'

    const gasLimit = BigNumber(req.data.gasLimit, 16)
    const maxFeePerGas = BigNumber(usesBaseFee(req.data) ? req.data.maxFeePerGas : req.data.gasPrice, 16) 
    const maxFee = maxFeePerGas.multipliedBy(gasLimit)
    const maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)

    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'

    let feeAtTime = '?.??'

    if (req && req.tx && req.tx.receipt && nativeUSD) {
      const { gasUsed, effectiveGasPrice } = req.tx.receipt
      const { type, gasPrice } = req.data

      const paidGas = effectiveGasPrice || (parseInt(type) < 2 ? gasPrice : null)

      if (paidGas) {
        const feeInWei = parseInt(gasUsed, 'hex') * parseInt(paidGas, 'hex')
        const feeInEth = feeInWei / 1e18
        const feeInUsd = feeInEth * nativeUSD
        feeAtTime = (Math.round(feeInUsd * 100) / 100).toFixed(2)
      }
    }

    let displayStatus = req.status
    if (displayStatus === 'verifying') displayStatus = 'waiting for block'


    return (
      <>
        <div className={req.automaticFeeUpdateNotice ? 'automaticFeeUpdate automaticFeeUpdateActive' : 'automaticFeeUpdate'}>
          <div className='txActionButtons'>
            <div className='txActionButtonsRow' style={{ padding: '0px 60px'}}>
              <div className='txActionText'>{'Fee Updated'}</div>
              <div className='txActionButton txActionButtonGood' onClick={() => {
                link.rpc('removeFeeUpdateNotice', req.handlerId, e => { 
                  if (e) console.error(e) 
                })
              }}>{'Ok'}</div>
            </div>
          </div>
        </div>
        <div className='requestApprove'>
          <div
            className='requestDecline' 
            onClick={() => {
              if (this.state.allowInput) this.decline(req)
            }}
          >
            <div className='requestDeclineButton _txButton _txButtonBad'>
              <span>Decline</span>
            </div>
          </div>
          <div
            className='requestSign' 
            onClick={() => {
              if (this.state.allowInput) {
                link.rpc('signerCompatibility', req.handlerId, (e, compatibility) => {
                  if (e === 'No signer')  {
                    this.store.notify('noSignerWarning', { req })
                  } else if (e === 'Signer locked') {
                    this.store.notify('signerLockedWarning', { req })
                  } else if (!compatibility.compatible && !this.store('main.mute.signerCompatibilityWarning')) {
                    this.store.notify('signerCompatibilityWarning', { req, compatibility, chain: chain })
                  } else if ((maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00') && !this.store('main.mute.gasFeeWarning')) {
                    this.store.notify('gasFeeWarning', { req, feeUSD: this.toDisplayUSD(maxFeeUSD), currentSymbol })
                  } else {
                    this.approve(req.handlerId, req)
                  }
                })
              }}
            }
          >
            <div className='requestSignButton _txButton'>
              <span>Sign</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  render () {
    const { req } = this.props
    const { notice } = req

    return (
      <div className='requestNotice'>
        <div className='requestNoticeInner'>
          <TxBar req={req} />
          {notice ? (
            this.sentStatus()
          ) : (
            this.signOrDecline()
          )}
          <TxConfirmations req={req} />
        </div>
      </div>
    )
  }
}

const RequestApprove = Restore.connect(_RequestApprove)

class _Footer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      allowInput: true
    }
  }
  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }
  decline (reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }
  render () {
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      if (req) {
        if (req.type === 'transaction' && crumb.data.step === 'confirm') {
          return (
            <div className='footerModule'>
              <RequestApprove req={req} />
            </div>
          )
        } else if (req.type === 'access') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:giveAccess', req, false) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:giveAccess', req, true) 
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Approve</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'sign') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) this.decline(req.handlerId, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) this.approve(req.handlerId, req) 
                  }}
                >
                  <div className='requestSignButton _txButton'>
                    <span>Sign</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'signTypedData') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}} 
                  onClick={() => { if (this.state.allowInput) this.decline(req.handlerId, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) this.approve(req.handlerId, req) 
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Sign</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'addChain' || req.type === 'switchChain') {
          return (
            req.type === 'switchChain' ? (
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', false, false, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', chain.type, parseInt(chain.id), req)
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Switch</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { 
                    if (this.state.allowInput) {
                      link.send('tray:rejectRequest', req)
                    }
                  }
                }>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) {
                      link.send('tray:resolveRequest', req, null)
                      link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'addChain', notifyData: { chain } } })
                    }
                  }
                }>
                  <div className='requestSignButton _txButton'>
                    <span>Review</span>
                  </div>
                </div>
              </div>
            )
          )
        } else if (req.type === 'addToken') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div
                  className='requestDecline'
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:addToken', false, this.props.req)
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div
                  className='requestSign'
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) {
                      link.send('tray:resolveRequest', req, null)
                      link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'addToken', notifyData: { token: req.token } } })
                    }
                  }
                }>
                  <div className='requestSignButton _txButton'>
                    <span>Review</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          return null
        }
      }
    }
  }
}

const Footer = Restore.connect(_Footer)

class Main extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      accountFilter: ''
    }
  }

  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll () {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  accountSort (accounts, a, b) {
    try {
      let [aBlock, aLocal] = accounts[a].created.split(':')
      let [bBlock, bLocal] = accounts[b].created.split(':')
  
      aLocal = parseInt(aLocal)
      bLocal = parseInt(bLocal)
  
      if (aBlock === 'new' && bBlock !== 'new') return -1
      if (bBlock !== 'new' && aBlock === 'new') return 1
      if (aBlock === 'new' && bBlock === 'new') return aLocal >= bLocal ? 1 : 0
  
      aBlock = parseInt(aBlock)
      bBlock = parseInt(bBlock)
  
      if (aBlock > bBlock) return -1
      if (aBlock < bBlock) return -1
      if (aBlock === bBlock) return aLocal >= bLocal ? 1 : 0

      return 0
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  render () {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const open = this.store('selected.open')
    if (!open) return

    const currentAccount = accounts[current]
    if (!currentAccount) return null

    return (
      <>
        <Account 
          key={current.id} 
          {...currentAccount} 
          index={1} 
          reportScroll={() => this.reportScroll()} 
          resetScroll={() => this.resetScroll()} 
        />
        <Footer />
      </>
    )
  }
}

export default Restore.connect(Main)
