import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

import TxBar from './TxBar'

import TxFee from './TxFee'

const FEE_WARNING_THRESHOLD_USD = 10

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
      <div className='txProgressSuccessItem'>
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
    this.state = { allowInput: false, dataView: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 1700)
  }

  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }

  decline (reqId, req) {
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
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')
    const fee = this.hexToDisplayValue(utils.numberToHex(parseInt(req.data.gas, 16) * parseInt(req.data.gasPrice, 16)))
    const feeUSD = fee * etherUSD
    const height = mode === 'monitor' ? '185px' : '320px'
    const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    // const statusClass = 'txStatus'
    // if (!success && !error) statusClass += ' txStatusCompact'
    if (notice && notice.toLowerCase().startsWith('insufficient funds for')) notice = 'insufficient funds'
    const { type, id } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'Ξ'
    return (
      <div key={req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: z }}>
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestNotice'>
                  <div className='requestNoticeInner'>
                    {!error ? (
                      <div className={success || !req.tx ? 'txAugment txAugmentHidden' : 'txAugment'}>
                        <div className='txAugmentCancel'>Cancel</div>
                        <div
                          className={req.tx ? 'txDetails txDetailsShow' : 'txDetails'}
                          onMouseDown={() => {
                            if (req && req.tx && req.tx.hash) {
                              if (this.store('main.mute.explorerWarning')) {
                                link.send('tray:openExplorer', req.tx.hash)
                              } else {
                                this.store.notify('openExplorer', { hash: req.tx.hash })
                              }
                            }
                          }}
                        >
                          View Details
                        </div>
                        <div
                          className='txAugmentSpeedUp' onMouseDown={() => {
                            link.send('tray:speedTx', req.handlerId)
                          }}
                        >Speed Up
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
                          <div className='txProgressSuccessLine' />
                          <div className='txProgressSuccessItem' style={{ justifyContent: 'flex-end' }}>
                            <div className='txProgressSuccessItemLabel'>
                              In Block
                            </div>
                            <div className='txProgressSuccessItemValue'>
                              {parseInt(req.tx.receipt.blockNumber, 'hex')}
                            </div>
                          </div>
                          <Time time={req.completed} />
                        </>
                      ) : null}
                    </div>
                    <div className='txStatus' style={!req.tx && !error ? { top: '60px' } : {}}>
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
                      <div className='monitorValue'><span>Ξ</span>{value}</div>
                      <div className='monitorArrow'>{svg.longArrow(14)}</div>
                      {toAddress ? (
                        <div className='monitorTo'>
                          {toAddress.substring(0, 6)}
                          {svg.octicon('kebab-horizontal', { height: 14 })}
                          {toAddress.substr(toAddress.length - 4)}
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
                    <div className='approveRequestHeaderIcon'> {svg.octicon('radio-tower', { height: 22 })}</div>
                    <div className='approveRequestHeaderLabel'> Transaction</div>
                  </div>
                  <div className='transactionValue'>
                    <div className='transactionTotals'>
                      <div className='transactionTotalETH'>
                        <span className='transactionSymbol'>{currentSymbol}</span>
                        <span>{value}</span>
                      </div>
                      {id === '1' ? (
                        <div className='transactionTotalUSD'>{'$' + (value * etherUSD).toFixed(2)}</div>
                      ) : null}
                    </div>
                    <div className='transactionSubtitle'>Value</div>
                  </div>
                  <TxFee {...this.props} />
                  {utils.toAscii(req.data.data || '0x') ? (
                    <div className={this.state.dataView ? 'transactionData transactionDataSelected' : 'transactionData'}>
                      <div className='transactionDataHeader' onMouseDown={() => this.toggleDataView()}>
                        <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
                        <div className='transactionDataLabel'>View Data</div>
                        <div className='transactionDataIndicator'>{svg.octicon('chevron-down', { height: 16 })}</div>
                      </div>
                      <div className='transactionDataBody'>
                        <div className='transactionDataBodyInner' onMouseDown={() => this.copyData(req.data.data)}>
                          {this.state.copiedData ? (
                            <div className='transactionDataBodyCopied'>
                              <div>Copied</div>
                              {svg.octicon('clippy', { height: 20 })}
                            </div>
                          ) : req.data.data}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='transactionData transactionNoData'>No Data</div>
                  )}
                  {req.data.to ? (
                    <div className='transactionTo'>
                      <div className='transactionToAddress'>
                        <div className='transactionToAddressLarge'>{req.data.to.substring(0, 11)} {svg.octicon('kebab-horizontal', { height: 20 })} {req.data.to.substr(req.data.to.length - 11)}</div>
                        <div className='transactionToAddressFull'>
                          {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 10 })}</span> : req.data.to}
                          <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={req.data.to} readOnly />
                        </div>
                      </div>
                      <div className='transactionToSub'>Send To</div>
                    </div>
                  ) : (
                    <div className='transactionTo'>
                      <div className='transactionToSub'>Deploying Contract</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
        {!notice ? (
          <div className='requestApprove'>
            <div className='requestDecline' onMouseDown={() => { if (this.state.allowInput) this.decline(req.handlerId, req) }}>
              <div className='requestDeclineButton'>Decline</div>
            </div>
            <div
              className='requestSign' onMouseDown={() => {
                if (this.state.allowInput) {
                  if (feeUSD > FEE_WARNING_THRESHOLD_USD || !feeUSD) {
                    this.store.notify('gasFeeWarning', { req, feeUSD })
                  } else {
                    this.approve(req.handlerId, req)
                  }
                }
              }}
            >
              <div className='requestSignButton'> Sign </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
