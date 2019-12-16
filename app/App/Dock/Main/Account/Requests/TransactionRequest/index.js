import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

import TxBar from './TxBar'

const FEE_WARNING_THRESHOLD_USD = 10

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      allowInput: false,
      dataView: false,
      selectedIndex: -1,
      hoverGasPrice: '',
      hoverGasColor: 'rgba(255, 255, 255, 1)',
      hoverGasPercent: ''
    }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 1700)
    const toAddress = this.props.req.data && this.props.req.data.to ? this.props.req.data.to : ''
    if (toAddress) {
      link.rpc('lookupEns', toAddress, (err, name) => {
        if (!err && name) this.setState({ toEnsName: name })
      })
    }
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

  setGasPrice (price) {
    if (price && price !== this.props.req.data.gasPrice) link.rpc('setGasPrice', price, this.props.req.handlerId, e => console.log(e))
    this.setState({ selectedIndex: -1 })
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

  selectSection (index) {
    if (index === this.state.selectedIndex) {
      this.setState({ selectedIndex: -1 })
    } else {
      this.setState({ selectedIndex: index })
    }
  }

  expandFee (index, height) {
    if (this.state.selectedIndex === index) {
      return {
        transform: 'translateY(0px)',
        height: '170px',
        zIndex: 20,
        left: '0px',
        right: '0px',
        padding: '100px 10px'
      }
    } else {
      return {
        transform: `translateY(${(index * -40) - 60}px)`,
        zIndex: 1
      }
    }
  }

  hoverBar (hoverGasPercent) {
    const low = [0, 210, 180]
    const high = [250, 100, 155]
    const w1 = hoverGasPercent
    const w2 = 1 - w1
    const hoverGasColor = `rgba(${Math.round(low[0] * w1 + high[0] * w2)}, ${Math.round(low[1] * w1 + high[1] * w2)}, ${Math.round(low[2] * w1 + high[2] * w2)}, 1)`
    const fast = this.store('main.gasPrice.levels.fast')
    const slow = this.store('main.gasPrice.levels.slow')
    const top = parseInt(fast, 16) * 4
    const bottom = parseInt(slow, 16) / 10
    const percentBuffer = Math.round((bottom / top) * 100) / 100
    hoverGasPercent = hoverGasPercent + percentBuffer
    const hoverGasPrice = utils.numberToHex(Math.round(top * hoverGasPercent))
    this.setState({ hoverGasPercent, hoverGasColor, hoverGasPrice })
  }

  handleCustomPriceHover (e, initial) {
    if (!this.state.hoverGasPercent && !initial) return
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    this.hoverBar((Math.round((x / rect.width) * 100)) / 100)
  }

  handleCustomPriceHoverReset () {
    this.setState({ hoverGasPrice: '', hoverGasColor: 'rgba(255, 255, 255, 1)', hoverGasPercent: '' })
  }

  renderFeeLabel (current, expanded) {
    return (
      <div className='txSectionLabelLeft'>
        <div className='txSectionLabelLeftInner' style={{ padding: '7px', transform: expanded ? 'translateX(0px)' : 'translateX(70px)', opacity: current ? 1 : 0 }}>
          {svg.octicon('chevron-right', { height: 16 })}
          {svg.octicon('chevron-right', { height: 16 })}
          {svg.octicon('chevron-right', { height: 16 })}
        </div>
        <div className='txSectionLabelLeftInner' style={{ transform: expanded ? 'translateX(-70px)' : 'translateX(0px)', opacity: current ? 1 : 0 }}>
          Fee
        </div>
      </div>
    )
  }

  renderFee () {
    const expanded = this.state.selectedIndex === 0
    const { data, mode } = this.props.req
    let feeLevel = 'custom'
    const gasLevels = this.store('main.gasPrice.levels')
    Object.keys(gasLevels).forEach(level => {
      if (gasLevels[level] === data.gasPrice) feeLevel = level
    })
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0

    const slowFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.slow, 16)))
    const slowFeeUSD = slowFee * etherUSD

    const normalFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.normal, 16)))
    const normalFeeUSD = normalFee * etherUSD

    const fastFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.fast, 16)))
    const fastFeeUSD = fastFee * etherUSD

    const customFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(this.state.hoverGasPrice || data.gasPrice, 16)))
    const customFeeUSD = customFee * etherUSD

    const height = mode === 'monitor' ? '145px' : '360px'
    const style = this.expandFee(0, height)

    let slideLevel

    if (feeLevel === 'slow') {
      slideLevel = '-10px'
    } else if (feeLevel === 'normal') {
      slideLevel = '-50px'
    } else if (feeLevel === 'fast') {
      slideLevel = '-90px'
    } else if (feeLevel === 'custom') {
      slideLevel = '-130px'
    }

    return (
      <div className='txSection txFee' style={style} onMouseDown={() => this.selectSection(0)}>
        <div className='networkFeeLabel' style={{ transform: expanded ? 'translateY(0px)' : 'translateY(-40px)' }}>Fee</div>
        <div className='networkFeeOptions' style={!expanded ? { transitionDelay: '0s', transform: `translateY(${slideLevel})` } : { transform: 'translateY(0px)' }}>
          <div className='networkFeeOption' onMouseDown={expanded ? () => this.setGasPrice(gasLevels.slow) : null}>
            {this.renderFeeLabel(feeLevel === 'slow', expanded)}
            <div className='txSectionLabelRight'>Slow</div>
            <div className='networkFeeTotal'>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + slowFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + slowFeeUSD.toFixed(2)}</div>
              {slowFeeUSD > FEE_WARNING_THRESHOLD_USD || !slowFeeUSD ? <div className='transactionFeeWarning'>{svg.octicon('alert', { height: 16 })}️️️</div> : null}
            </div>
          </div>
          <div className='networkFeeOption' onMouseDown={expanded ? () => this.setGasPrice(gasLevels.normal) : null}>
            {this.renderFeeLabel(feeLevel === 'normal', expanded)}
            <div className='txSectionLabelRight'>Normal</div>
            <div className='networkFeeTotal'>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + normalFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + normalFeeUSD.toFixed(2)}</div>
              {normalFeeUSD > FEE_WARNING_THRESHOLD_USD || !normalFeeUSD ? <div className='transactionFeeWarning'>{svg.octicon('alert', { height: 16 })}️️️</div> : null}
            </div>
          </div>
          <div className='networkFeeOption' onMouseDown={expanded ? () => this.setGasPrice(gasLevels.fast) : null}>
            {this.renderFeeLabel(feeLevel === 'fast', expanded)}
            <div className='txSectionLabelRight'>Fast</div>
            <div className='networkFeeTotal'>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + fastFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + fastFeeUSD.toFixed(2)}</div>
              {fastFeeUSD > FEE_WARNING_THRESHOLD_USD || !fastFeeUSD ? <div className='transactionFeeWarning'>{svg.octicon('alert', { height: 16 })}️️️</div> : null}
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => { this.setGasPrice(this.state.hoverGasPrice) } : null}
            onMouseEnter={expanded ? e => this.handleCustomPriceHover(e, true) : null}
            onMouseMove={expanded ? e => this.handleCustomPriceHover(e) : null}
            onMouseLeave={expanded ? e => this.handleCustomPriceHoverReset() : null}
          >
            {this.renderFeeLabel(feeLevel === 'custom', expanded)}
            <div className='txSectionLabelRight'>Custom</div>
            <div className='networkFeeTotal'>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + customFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + customFeeUSD.toFixed(2)}</div>
              {customFeeUSD > FEE_WARNING_THRESHOLD_USD || !customFeeUSD ? <div className='transactionFeeWarning'>{svg.octicon('alert', { height: 16 })}️️️</div> : null}
            </div>
            <div className='customGasPriceBar'>
              <div className='customGasPriceBarInner' style={{ background: this.state.hoverGasColor, width: ((this.state.hoverGasPercent * 100) + 5) + '%', transform: 'translateX(-50%)', left: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const req = this.props.req
    let { notice } = req
    const { status, mode, description } = req
    // const originString = 'Created by ' + origin.replace('http://', '').replace('https://', '')
    const toAddress = req.data && req.data.to ? req.data.to : ''
    let requestClass = 'signerRequest'
    if (mode === 'monitor') requestClass += ' signerRequestMonitor'
    const success = req.status === 'confirming' || req.status === 'confirmed'
    const error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')
    const fee = this.hexToDisplayValue(utils.numberToHex(parseInt(req.data.gas, 16) * parseInt(req.data.gasPrice, 16)))
    const feeUSD = fee * etherUSD
    const height = mode === 'monitor' ? '145px' : '360px'
    const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    let statusClass = 'txStatus'
    if (!success && !error) statusClass += ' txStatusCompact'
    if (notice && notice.toLowerCase().startsWith('insufficient funds for')) notice = 'insufficient funds'
    return (
      <div key={req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: z }}>
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestNotice'>
                  <div className='requestNoticeInner'>
                    <div className={statusClass}>
                      <div className='txProgressNotice'>
                        <div className={success ? 'txProgressNoticeSuccess' : 'txProgressNoticeSuccess txProgressNoticeHidden'} onMouseDown={() => { if (req && req.tx && req.tx.hash) this.store.notify('openEtherscan', { hash: req.tx.hash }) }}>
                          <div className='txProgressDetailHash'>
                            {req && req.tx && req.tx.hash ? req.tx.hash.substring(0, 14) : ''}
                            {svg.octicon('kebab-horizontal', { height: 14 })}
                            {req && req.tx && req.tx.hash ? req.tx.hash.substr(req.tx.hash.length - 12) : ''}
                          </div>
                          <div className='txProgressDetailExpand'>View Details</div>
                        </div>
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
                    <div className='approveRequestHeaderLabel'>
                      {svg.octicon('radio-tower', { height: 18 })}
                      <div>Action</div>
                    </div>
                    <div className='approveRequestHeaderIcon'> {svg.octicon('radio-tower', { height: 18 })}</div>
                  </div>
                  <div className='txDetails'>
                    {description ? (
                      <>
                        <div className='txDescription'>{description.type + description.message}</div>
                        <div className='transactionTotals'>
                          <div className='transactionTotalETH'>{'Ξ ' + value}</div>
                          <div className='transactionTotalUSD'>{'$ ' + (value * etherUSD).toFixed(2)}</div>
                        </div>
                      </>
                    ) : 'Loading'}
                  </div>
                  {utils.toAscii(req.data.data || '0x') ? (
                    <div className='txSection txData' style={this.txSectionStyle(2, height)} onMouseDown={() => this.selectSection(2)}>
                      <div className='transactionDataHeader' onMouseDown={() => this.toggleDataView()}>
                        <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 16 })}</div>
                        <div className='transactionDataLabel'>Raw Data</div>
                        <div className='transactionDataIndicator'>{svg.octicon('chevron-down', { height: 16 })}</div>
                      </div>
                      <div className='transactionDataBody'>
                        <div className='transactionDataBodyInner'>
                          {req.data.data}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='txSection txData' style={this.txSectionStyle(2, height)}>
                      No Data
                    </div>
                  )}
                  {req.data.to ? (
                    <div className='txSection' style={this.txSectionStyle(1, height)} onMouseDown={() => this.selectSection(1)}>
                      <div className='transactionToAddress'>
                        {this.state.toEnsName ? (
                          <div className='transactionToAddressLarge'>{this.state.toEnsName}</div>
                        ) : (
                          <div className='transactionToAddressLarge'>{req.data.to.substring(0, 6)} {svg.octicon('kebab-horizontal', { height: 20 })} {req.data.to.substr(req.data.to.length - 4)}</div>
                        )}
                        <div className='transactionToAddressFull'>
                          {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 10 })}</span> : req.data.to}
                          <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={req.data.to} readOnly />
                        </div>
                      </div>
                      <div className='networkFee'>To</div>
                    </div>
                  ) : (
                    <div className='txSection' style={this.txSectionStyle(1, height)} onMouseDown={() => this.selectSection(1)}>
                      <div className='transactionToSub'>Deploying Contract</div>
                    </div>
                  )}
                  {this.renderFee()}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
        {!notice ? (
          <div className='requestApprove'>
            <div className='requestDecline'>
              <div className='requestDeclineButton' onClick={() => { if (this.state.allowInput) this.decline(req.handlerId, req) }}>Decline</div>
            </div>
            <div className='requestApproveSplit' />
            <div className='requestSign'>
              <div
                className='requestSignButton'
                onClick={() => {
                  if (this.state.allowInput) {
                    if (feeUSD > FEE_WARNING_THRESHOLD_USD || !feeUSD) {
                      this.store.notify('gasFeeWarning', { req, feeUSD })
                    } else {
                      this.approve(req.handlerId, req)
                    }
                  }
                }}
              >
                {'Sign'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
