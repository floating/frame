import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

import TxBar from './TxBar'

// import TxFee from './TxFee'


// New Tx
import TxMain from './TxMain'
import TxFeeNew from './TxFeeNew'
import TxData from './TxData'
import TxRecipient from './TxRecipient'
import TxOverlay from './TxOverlay'



import TxModule from './TxModule'

const FEE_WARNING_THRESHOLD_USD = 20

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
      id: parseInt(props.req.data.chainId, 'hex').toString()
    }
    this.state = { allowInput: false, dataView: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 1700)
  }

  copyAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }

  decline (reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }

  removeWarning (reqId, req) {
    link.rpc('removeRequestWarning', reqId, () => {}) // Move to link.send
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

  render () {
    const req = this.props.req
    let notice = req.notice
    const status = req.status
    const mode = req.mode
    const toAddress = req.data && req.data.to ? req.data.to : ''
    let requestClass = 'signerRequest'
    if (mode === 'monitor') requestClass += ' signerRequestMonitor'
    const success = (req.status === 'confirming' || req.status === 'confirmed')
    const error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'
    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const etherUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')

    const fee = this.hexToDisplayValue(req.data.maxFee || '0x')
    const feeUSD = fee * etherUSD
    const height = req.status === 'error' ? '205px' : mode === 'monitor' ? '205px' : '340px'
    const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'
    // if (!success && !error) statusClass += ' txStatusCompact'
    if (notice && notice.toLowerCase().startsWith('insufficient funds for')) notice = 'insufficient funds'
    // const currentSymbol = this.store('main.networks', this.chain.type, this.chain.id, 'symbol') || '?'
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
          } else if (parseInt(monitorFilter[i].data.gasPrice, 'hex') >= parseInt(req.data.gasPrice, 'hex')) {
            txMeta.possible = false
            txMeta.notice = 'gas price too low'
          }
        }
      })
    }

    let nonce = parseInt(req.data.nonce, 'hex')
    if (isNaN(nonce)) nonce = 'TBD'

    const otherChain = (this.chain.id !== this.store('main.currentNetwork.id')) && !this.state.allowOtherChain

    let metaChainClass = 'requestMetaChain'
    if (this.chain.id !== this.store('main.currentNetwork.id')) metaChainClass += ' requestMetaChainTestnet'
    // if (layer === 'sidechain') metaChainClass += ' requestMetaChainSidechain'
    // if (layer === 'rollup') metaChainClass += ' requestMetaChainRollup'
    // if (layer === 'mainnet') metaChainClass += ' requestMetaChainMainnet'

    return (
      <div key={req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: z }}>
        <TxOverlay {...this.props} overlayMode={this.state.overlayMode}/>
        <div className='requestMeta'>
          <div className={metaChainClass} style={{ textTransform: 'uppercase' }}>{this.store('main.networks', this.chain.type, this.chain.id, 'name')}</div>
          <div className='requestMetaOrigin'>{req.origin}</div>
        </div>
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            {(req.warning || otherChain) && !status &&
            status !== 'error' && 
            status !== 'pending' && 
            status !== 'verifying' && 
            !status &&
            mode !== 'monitor' ? (
              <div className='approveTransactionWarning'>
                <div className='approveTransactionWarningOptions'>
                  <div
                    className='approveTransactionWarningReject'
                    onMouseDown={() => this.decline(this.props.req.handlerId, this.props.req)}
                  >Reject
                  </div>
                  <div
                    className='approveTransactionWarningPreview'
                    onMouseEnter={() => {
                      this.setState({ warningPreview: true })
                    }}
                    onMouseMove={() => {
                      this.setState({ warningPreview: true })
                    }}
                    onMouseLeave={() => {
                      this.setState({ warningPreview: false })
                    }}
                  >
                    Preview
                  </div>
                  <div
                    className='approveTransactionWarningProceed'
                    onMouseDown={() => {
                      if (otherChain) {
                        this.setState({ allowOtherChain: true})
                      } else {
                        this.removeWarning(this.props.req.handlerId)
                      }
                    }}
                  >Proceed
                  </div>
                </div>
                <div className='approveTransactionWarningFill' style={this.state.warningPreview ? { opacity: 0 } : { opacity: 1 }}>
                  <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
                    {svg.alert(32)}
                  </div>
                  <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
                    {svg.alert(32)}
                  </div>
                  <div className='approveTransactionWarningTitle'>{otherChain ? 'chain warning' : 'estimated to fail'} </div>
                  <div className='approveTransactionWarningMessage'>{otherChain ? 'transaction is not on currently selected chain' : req.warning}</div>
                </div>
              </div>
            ) : null}
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
                        <div className='txAugmentCancel' onMouseDown={() => link.send('tray:replaceTx', req.handlerId, 'cancel')}>
                          Cancel
                        </div>
                        <div
                          className={req && req.tx && req.tx.hash ? 'txDetails txDetailsShow' : 'txDetails txDetailsHide'}
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
                          View Details
                        </div>
                        <div className='txAugmentSpeedUp' onMouseDown={() => link.send('tray:replaceTx', req.handlerId, 'speed')}>
                          Speed Up
                        </div>
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
                              {req.feeAtTime || '?.??'}
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
                        {status === 'pending' ? <div className='txProgressCancel' onMouseDown={() => this.decline(this.props.req.handlerId, this.props.req)}>Cancel</div> : null}
                      </div>
                    </div>
                    <TxBar req={req} />
                    <div className='monitorIcon'>{svg.octicon('radio-tower', { height: 17 })}</div>
                    <div className='monitorIconIndicator' />
                    <div className='monitorTop'>
                      <div className='monitorValue'><span>{currentSymbol}</span>{value}</div>
                      <div className='monitorArrow'>{svg.longArrow(13)}</div>
                      {toAddress ? (
                        <div className='monitorTo'>
                          {toAddress.substring(0, 5)}
                          {svg.octicon('kebab-horizontal', { height: 14 })}
                          {toAddress.substr(toAddress.length - 3)}
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
                  <TxData {...this.props} />
                  <TxFeeNew {...this.props} chain={this.chain} overlayMode={this.overlayMode.bind(this)}/>
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
            <div
              className='requestDecline' onClick={() => {
                if (this.state.allowInput && this.props.onTop) this.decline(req.handlerId, req)
              }}
            >
              <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
            </div>
            <div
              className='requestSign' onClick={() => {
                if (this.state.allowInput && this.props.onTop) {
                  if ((feeUSD > FEE_WARNING_THRESHOLD_USD || !feeUSD) && !this.store('main.mute.gasFeeWarning')) {
                    this.store.notify('gasFeeWarning', { req, feeUSD })
                  } else {
                    this.approve(req.handlerId, req)
                  }
                }
              }}
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
