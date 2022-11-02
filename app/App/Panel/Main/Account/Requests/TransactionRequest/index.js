import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'

import { usesBaseFee } from '../../../../../../../resources/domain/transaction'
import { ApprovalType } from '../../../../../../../resources/constants'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

import TxBar from './TxBar'

// New Tx
import TxMain from './TxMain'
import TxFeeNew from './TxFeeNew'
import TxData from './TxData'
import TxRecipient from './TxRecipient'
import TxOverlay from './TxOverlay'
import TxApproval from './TxApproval'

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
    let label, time
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

class TransactionRequest extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.chain = { 
      type: 'ethereum', 
      id: parseInt(props.req.data.chainId, 'hex')
    }
    this.state = { allowInput: false, dataView: false }

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  copyAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }

  decline (req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }

  toggleDataView (id) {
    this.setState({ dataView: !this.state.dataView })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  txSectionStyle (index, height) {
    if (this.state.selectedIndex === index) {
      return {
        transform: `translateY(${0}px)`,
        height: `calc(${height} + 10px)`,
        zIndex: 20,
        borderRadius: '9px',
        background: 'rgba(237, 242, 253, 1)',
        left: '10px',
        right: '10px',
        padding: '0px 30px'
      }
    } else {
      return {
        transform: `translateY(${(index * -40) - 60}px)`,
        zIndex: 1
      }
    }
  }

  copyData (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedData: true })
    setTimeout(_ => this.setState({ copiedData: false }), 1000)
  }

  overlayMode (mode) {
    this.setState({ overlayMode: mode })
  }

  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }

  allowOtherChain () {
    this.setState({ allowOtherChain: true })
  }


  render () {
    const req = this.props.req
    const originalNotice = (req.notice || '').toLowerCase()
    let notice = req.notice

    const status = req.status
    const mode = req.mode
    const toAddress = (req.data && req.data.to) || ''
    let requestClass = 'signerRequest'
    if (mode === 'monitor') requestClass += ' signerRequestMonitor'
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

    const height = req.status === 'error' ? '215px' : mode === 'monitor' ? '215px' : '340px'
    const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'
    // if (!success && !error) statusClass += ' txStatusCompact'

    const insufficientFundsMatch = originalNotice.includes('insufficient funds')
    if (insufficientFundsMatch) {
      notice = originalNotice.includes('for gas') ? 'insufficient funds for gas' : 'insufficient funds'
    }

    const txMeta = { replacement: false, possible: true, notice: '' }
    // TODO
    // if (signer locked) {
    //   txMeta.possible = false
    //   txMeta.notice = 'signer is locked'
    // }
    if (mode !== 'monitor' && req.data.nonce) {
      const r = this.store('main.accounts', this.props.accountId, 'requests')
      const requests = Object.keys(r || {}).map(key => r[key])
      const monitor = requests.filter(req => req.mode === 'monitor')
      const monitorFilter = monitor.filter(r => r.status !== 'error')
      const existingNonces = monitorFilter.map(m => m.data.nonce)
      existingNonces.forEach((nonce, i) => {
        if (req.data.nonce === nonce) {
          txMeta.replacement = true
          if (monitorFilter[i].status === 'confirming' || monitorFilter[i].status === 'confirmed') {
            txMeta.possible = false
            txMeta.notice = 'nonce used'
          } else if (
            req.data.gasPrice &&
            parseInt(monitorFilter[i].data.gasPrice, 'hex') >= parseInt(req.data.gasPrice, 'hex')
          ) {
            txMeta.possible = false
            txMeta.notice = 'gas price too low'
          } else if (
              req.data.maxPriorityFeePerGas &&
              req.data.maxFeePerGas &&
              Math.ceil(parseInt(monitorFilter[i].data.maxPriorityFeePerGas, 'hex') * 1.1) > parseInt(req.data.maxPriorityFeePerGas, 'hex') &&
              Math.ceil(parseInt(monitorFilter[i].data.maxFeePerGas, 'hex') * 1.1) > parseInt(req.data.maxFeePerGas, 'hex')
            ) {
            txMeta.possible = false
            txMeta.notice = 'gas fees too low'
          }
        }
      })
    }

    let nonce = parseInt(req.data.nonce, 'hex')
    if (isNaN(nonce)) nonce = 'TBD'

    const otherChain = (this.chain.id !== this.store('main.currentNetwork.id')) && !this.state.allowOtherChain

    let metaChainClass = 'requestMetaChain'
    if (this.chain.id !== this.store('main.currentNetwork.id')) metaChainClass += ' requestMetaChainWarn'
    // if (layer === 'sidechain') metaChainClass += ' requestMetaChainSidechain'
    // if (layer === 'rollup') metaChainClass += ' requestMetaChainRollup'
    // if (layer === 'mainnet') metaChainClass += ' requestMetaChainMainnet'

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

    const showWarning = !status && mode !== 'monitor'
    const requiredApproval = showWarning && (
      otherChain 
        ? { 
          type: ApprovalType.OtherChainApproval,
          data: {
            message: 'transaction is not on currently selected chain',
            title: 'chain warning'
          }
        }
        : (req.approvals || []).filter(a => !a.approved)[0]
    )

    return (
      <div key={req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: z }}>
        <TxOverlay {...this.props} overlay={this.state.overlayMode} overlayMode={this.overlayMode.bind(this)}/>
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            {
              !!requiredApproval ? (
                <TxApproval
                 req={this.props.req}
                 approval={requiredApproval}
                 allowOtherChain={this.allowOtherChain.bind(this)} />
              ) : null
            }
            <div className='approveTransactionPayload'>
              <div className={notice ? 'txNonce txNonceSet' : 'txNonce'} style={!this.store('main.nonceAdjust') || error || status || mode === 'monitor' ? { pointerEvents: 'none' } : {}}>
                <div className='txNonceControl'>
                  <div className='txNonceButton txNonceButtonLower' onMouseDown={() => link.send('tray:adjustNonce', req.handlerId, -1)}>
                    {svg.octicon('chevron-down', { height: 14 })}
                  </div>
                  <div className='txNonceButton txNonceButtonRaise' onMouseDown={() => link.send('tray:adjustNonce', req.handlerId, 1)}>
                    {svg.octicon('chevron-up', { height: 14 })}
                  </div>
                  <div className='txNonceLabel'>Nonce</div>
                </div>
                <div className={nonce === 'TBD' || error ? 'txNonceNumber  txNonceHidden' : 'txNonceNumber'}>
                  {nonce}
                </div>
                {nonce === 'TBD' || error ? <div className='txNonceMarker' /> : null}
              </div>
              {notice ? (
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
                                    link.send('tray:openExplorer', 'transaction', req.tx.hash, this.chain)
                                  } else {
                                    this.store.notify('openExplorer', { type: 'transaction', hash_or_address: req.tx.hash, chain: this.chain })
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
                    <div className={statusClass} style={!req.tx && !error && mode === 'monitor' ? { bottom: '60px' } : {}}>
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
                    <div className='monitorIcon'>{svg.octicon('radio-tower', { height: 17 })}</div>
                    <div className='monitorIconIndicator' />
                    <div className='monitorTop'>
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
                    </div>
                    <div className='monitorConfirms'>
                      {[...Array(12).keys()].map(i => {
                        const monitorConfirmsItem = confirmations > i ? 'txProgressConfirmsItem txProgressConfirmsItemGood' : 'txProgressConfirmsItem'
                        return <div key={i} className={monitorConfirmsItem}>{svg.octicon('chevron-right', { height: 14 })}</div>
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className='requestMeta'>
                    <div className={metaChainClass} style={{ textTransform: 'uppercase' }}>{this.store('main.networks', this.chain.type, this.chain.id, 'name')}</div>
                    <div className='requestMetaOrigin'>{req.origin}</div>
                  </div>
                  <div className='approveRequestHeader approveTransactionHeader'>
                    <div className='approveRequestHeaderIcon'>
                      {svg.octicon('radio-tower', { height: 22 })}
                    </div>
                    <div className='approveRequestHeaderTitle'>
                      <div>Transaction</div>
                    </div>
                    {txMeta.replacement ? (
                      txMeta.possible ? (
                        <div className='approveRequestHeaderTag'>
                          valid replacement
                        </div>
                      ) : (
                        <div className='approveRequestHeaderTag approveRequestHeaderTagInvalid'>
                          {txMeta.notice || 'invalid duplicate'}
                        </div>
                      )
                    )
                      : null}
                  </div>
                  {/* <TxFee {...this.props} /> */}
                  <TxMain {...this.props} chain={this.chain}/>
                  <TxRecipient {...this.props} />
                  <TxData {...this.props} overlayMode={this.overlayMode.bind(this)} />
                  <TxFeeNew {...this.props} chain={this.chain} overlayMode={this.overlayMode.bind(this)}/ >
                  {/* <TxModule top={165} req={req} /> */}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
        {!notice ? (
          <div className='requestApprove'>
            {req.automaticFeeUpdateNotice ? (
              <div className='requestApproveFeeBlock cardShow'>
                <div className='requestApproveFeeButton requestApproveFeeReject' onClick={() => {
                  const { previousFee } = req.automaticFeeUpdateNotice
                  if (previousFee.type === '0x2') {
                    link.rpc('setBaseFee', previousFee.baseFee, req.handlerId, e => { if (e) console.error(e) })
                    link.rpc('setPriorityFee', previousFee.priorityFee, req.handlerId, e => { if (e) console.error(e) })
                  } else if (previousFee.type === '0x0')  {
                    link.rpc('setGasPrice', previousFee.gasPrice, req.handlerId, e => { if (e) console.error(e) })
                  }
                }}>{'reject'}</div>
                <div>{'fee updated'}</div>
                <div className='requestApproveFeeButton requestApproveFeeAccept' onClick={() => {
                  link.rpc('removeFeeUpdateNotice', req.handlerId, e => { if (e) console.error(e) })
                }}>{'accept'}</div>
              </div>
            ) : null}
            <div
              className='requestDecline' 
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => {
                if (this.state.allowInput && this.props.onTop) this.decline(req)
              }}
            >
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div
              className='requestSign' 
              style={{ pointerEvents: this.state.allowInput && this.props.onTop ? 'auto' : 'none'}}
              onClick={() => {
                if (this.state.allowInput && this.props.onTop) {
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
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
