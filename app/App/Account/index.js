import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'

import Account from './Account'
import TxBar from './TxBar'

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
    }, 1500)
    

    // setTimeout(() => {
    //   this.setState({ allowInput: true })
    // }, props.signingDelay || 1500)
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

  render () {
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

    if (notice) {
      return (
        <div className='requestNotice'>
          <div className='requestNoticeInner'>
            {!error ? (
              <div className={success || !req.tx ? 'txAugment txAugmentHidden' : 'txAugment'}>
                {this.state.txHashCopied ? (
                  <div className={'txDetailsOptions txDetailsOptionsTxHash'}>
                    Transaction Hash Copied
                  </div>
                ) : this.state.viewDetailsHover ? (
                  <div
                    className={'txDetailsOptions'}
                    onMouseOver={() => {
                      clearTimeout(this.viewDetailsHoverTimer)
                      this.setState({ viewDetailsHover: true })
                    }}
                    onMouseLeave={() => {
                      this.viewDetailsHoverTimer = setTimeout(() => {
                        this.setState({ viewDetailsHover: false })
                      }, 0)
                    }}
                  >
                    <div
                      className={'txDetailsOptionsOpen'}
                      onMouseDown={() => {
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
                      className={'txDetailsOptionsCopy'}
                      onMouseDown={() => {
                        if (req && req.tx && req.tx.hash) {
                          link.send('tray:copyTxHash', req.tx.hash)
                          this.setState({ txHashCopied: true, viewDetailsHover: false })
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
                  <>
                    <div
                      className={req && req.tx && req.tx.hash ? 'txDetails txDetailsShow' : 'txDetails txDetailsHide'}
                      onMouseOver={() => {
                        clearTimeout(this.viewDetailsHoverTimer)
                        this.setState({ viewDetailsHover: true })
                      }}
                      onMouseLeave={() => {
                        this.viewDetailsHoverTimer = setTimeout(() => {
                          this.setState({ viewDetailsHover: false })
                        }, 0)
                      }}
                    >
                      View Details
                    </div>
                    <div className='txAugmentCancel' onMouseDown={() => link.send('tray:replaceTx', req.handlerId, 'cancel')}>
                      Cancel
                    </div>
                    <div className='txAugmentSpeedUp' onMouseDown={() => link.send('tray:replaceTx', req.handlerId, 'speed')}>
                      Speed Up
                    </div>
                  </>
                )}
              </div>
            ) : null}
            <div className={success ? 'txSuccessHash ' : 'txSuccessHash'}>
              {req && req.tx && req.tx.hash ? req.tx.hash.substring(0, 9) : ''}
              {svg.octicon('kebab-horizontal', { height: 16 })}
              {req && req.tx && req.tx.hash ? req.tx.hash.substr(req.tx.hash.length - 7) : ''}
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
            {/* <div className={statusClass} style={!req.tx && !error && mode === 'monitor' ? { bottom: '60px' } : {}}> */}
            <div className={statusClass}>
              {success ? <div>Successful</div> : null}
              <div className='txProgressNotice'>
                <div className={success || (mode === 'monitor' && status !== 'verifying') ? 'txProgressNoticeBars txProgressNoticeHidden' : 'txProgressNoticeBars'}>
                  {[...Array(10).keys()].map(i => {
                    return <div key={'f' + i} className={`txProgressNoticeBar txProgressNoticeBar-${i}`} />
                  })}
                  <div className='txProgressNoticeBarDeadzone' />
                  {[...Array(10).keys()].reverse().map(i => {
                    return <div key={'r' + i} className={`txProgressNoticeBar txProgressNoticeBar-${i}`} />
                  })}
                </div>
                <div className={success || (mode === 'monitor' && status !== 'verifying') ? 'txProgressNoticeIcon txProgressNoticeHidden' : 'txProgressNoticeIcon'}>
                  {status === 'pending' ? svg.sign(23) : null}
                  {status === 'sending' ? svg.send(19) : null}
                  {status === 'verifying' ? svg.octicon('check', { height: 26 }) : null}
                  {status === 'error' ? svg.octicon('circle-slash', { height: 22 }) : null}
                </div>
                <div className={success ? 'txProgressNoticeText txProgressNoticeHidden' : mode === 'monitor' ? 'txProgressNoticeText txProgressNoticeSuccess' : 'txProgressNoticeText'}>
                  <div className='txProgressDetailError' onMouseDown={() => { if (req && notice && notice.toLowerCase() === 'please enable contract data on the ethereum app settings') this.store.notify('contractData') }}>
                    {status === 'verifying' || status === 'confirming' || status === 'confirmed' ? '' : notice}
                  </div>
                </div>
                {status === 'pending' ? <div className='txProgressCancel' onMouseDown={() => this.decline(this.props.req)}>Cancel</div> : null}
              </div>
            </div>
            <TxBar req={req} />
            {/* <div className='monitorIcon'>{svg.octicon('radio-tower', { height: 17 })}</div> */}
            {/* <div className='monitorIconIndicator' /> */}
            {/* <div className='monitorTop'>
              {toAddress ? (
                <div className='monitorTo'>
                  <span className='monitorSub'>{'TO'} </span>
                  <span className='monitorValue'>
                    <span className='monitorValue0x'>{'0x'}</span>
                    {toAddress.substring(2, 5)}
                    {svg.octicon('kebab-horizontal', { height: 14 })}
                    {toAddress.substring(toAddress.length - 3)}
                  </span>
                  <span className='monitorSub'>{'ON'} </span>
                  <span className='monitorSub monitorSubHighlight'>
                    {}
                    {this.store('main.networks', this.chain.type, this.chain.id, 'name')}
                  </span>
                </div>
              ) : (
                <div className='monitorDeploy'>deploy</div>
              )}
            </div> */}
            <div className='monitorConfirms'>
              {[...Array(12).keys()].map(i => {
                const monitorConfirmsItem = confirmations > i ? 'txProgressConfirmsItem txProgressConfirmsItemGood' : 'txProgressConfirmsItem'
                return <div key={i} className={monitorConfirmsItem}>{svg.octicon('chevron-right', { height: 14 })}</div>
              })}
            </div>
          </div>
        </div>
      )
    } else {
      return (
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
              if (this.state.allowInput && !req.automaticFeeUpdateNotice) {
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
      )
    }
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
                  onClick={() => { if (this.state.allowInput) this.approve(req.handlerId, req) 
                }}>
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
                  onClick={() => { if (this.state.allowInput) this.store.notify('addToken', this.props.req)
                }}>
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
