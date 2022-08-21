import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import utils from 'web3-utils'

import Account from './Account'
import AccountController from './AccountController'

// import Filter from '../../Components/Filter'

import TxBar from './TxBar'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

class _RequestApprove extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.chain = { 
      type: 'ethereum', 
      id: parseInt(props.req.data.chainId, 'hex')
    }
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
    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')
    const currentSymbol = this.store('main.networks', this.chain.type, this.chain.id, 'symbol') || '?'

    let maxFeePerGas, maxFee, maxFeeUSD

    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'



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
                            link.send('tray:openExplorer', req.tx.hash, this.chain)
                          } else {
                            this.store.notify('openExplorer', { hash: req.tx.hash, chain: this.chain })
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
            className={req.automaticFeeUpdateNotice ? 'requestApproveFeeBlock requestApproveFeeBlockActive' : 'requestApproveFeeBlock'}
          >
            <div className='requestApproveFeeText'>{'Fee Updated'}</div>
            <div className='requestApproveFeeButton' onClick={() => {
              link.rpc('removeFeeUpdateNotice', req.handlerId, e => { if (e) console.error(e) })
            }}>{'Ok'}</div>
            {/* <div className='' onClick={() => {
              const { previousFee } = req.automaticFeeUpdateNotice
              if (previousFee.type === '0x2') {
                link.rpc('setBaseFee', previousFee.baseFee, req.handlerId, e => { if (e) console.error(e) })
                link.rpc('setPriorityFee', previousFee.priorityFee, req.handlerId, e => { if (e) console.error(e) })
              } else if (previousFee.type === '0x0')  {
                link.rpc('setGasPrice', previousFee.gasPrice, req.handlerId, e => { if (e) console.error(e) })
              }
            }}>{'Revert'}</div> */}
          </div>
          <div
            className='requestDecline' 
            onClick={() => {
              if (this.state.allowInput) this.decline(req)
            }}
          >
            <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
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
                    this.store.notify('signerCompatibilityWarning', { req, compatibility, chain: this.chain })
                  } else if ((maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00') && !this.store('main.mute.gasFeeWarning')) {
                    this.store.notify('gasFeeWarning', { req, feeUSD: this.toDisplayUSD(maxFeeUSD), currentSymbol })
                  } else {
                    this.approve(req.handlerId, req)
                  }
                })
              }}
            }
          >
            <div className='requestSignButton _txButton'> Sign </div>
          </div>
        </div>
      )
    }
  }
}

const RequestApprove = Restore.connect(_RequestApprove)

class _Footer extends React.Component {
  // constructor (...args) {
  //   super(...args)
  //   this.state = {
  //     accountFilter: ''
  //   }
  // }
  render () {
    const crumb = this.store('windows.panel.nav')[0] || {}
    const accountId = this.store('selected.current')
    if (crumb.view === 'requestView') {
      const reqViewData = crumb.req // TODO: Only pass req id in nav
      const req = this.store('main.accounts', accountId, 'requests', reqViewData.handlerId)
      if (req) {
        return (
          <div className='footerModule'>
            <RequestApprove req={req} />
          </div>
        )
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
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')
    const sortedAccounts = Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b))
    const filter = this.store('panel.accountFilter')

    const { data } = this.store('panel.nav')[0] || {}
    const panelScrollStyle = current ? { 
      // overflow: 'hidden', 
      pointerEvents: 'none'
    } : {}

    if (open) {
      panelScrollStyle.top = '146px'
    }

    
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (crumb.view === 'requestView') panelScrollStyle.bottom = '142px'
    
    // if (data && data.aux && data.aux.height) panelScrollStyle.bottom = data.aux.height

    const displayAccounts = sortedAccounts.filter((id, i) => {
      const account = accounts[id]
      return !(
        filter &&
        !account.address.includes(filter) &&
        !account.name.includes(filter) &&
        !account.ensName.includes(filter) &&
        !account.lastSignerType.includes(filter)
      )
    })

    return (
      <div className={this.store('panel.view') !== 'default' ? 'card cardHide' : 'card cardShow'}>
        <div id='panelScroll' style={panelScrollStyle}>
          <div className='panelScrollOverlay' />
          <div 
            id='panelSlide' 
            ref={ref => { if (ref) this.scroll = ref }} 
            style={current ? { overflow: 'visible' } : {}}
          >
            <div className='panelFilter'>
              <div className='panelFilterIcon'>
                {svg.search(12)}
              </div>
              <div className='panelFilterInput'>
                <input 
                  tabIndex='-1'
                  onChange={(e) => {
                    const value = e.target.value
                    this.setState({ accountFilter: value  })
                    link.send('tray:action', 'setAccountFilter', value)
                  }}
                  value={this.state.accountFilter}
                />
              </div>
              {this.state.accountFilter ? (
                <div 
                  className='panelFilterClear'
                  onClick={() => {
                    this.setState({ accountFilter: '' })
                    link.send('tray:action', 'setAccountFilter', '')
                  }}
                >
                  {svg.close(12)}
                </div>
              ) : null}
            </div>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {displayAccounts.length ? (
                displayAccounts.map((id, i) => {
                  const account = accounts[id]
                  return <AccountController key={id} {...account} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />
                })
              ) : Object.keys(accounts).length === 0 ? (
                <div className='noSigners'>
                  {'No Accounts Added'}
                </div>
              ) : (
                <div className='noSigners'>
                  {'No Matching Accounts'}
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

export default Restore.connect(Main)
