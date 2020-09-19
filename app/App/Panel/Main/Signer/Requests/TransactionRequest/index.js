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
    this.state = { allowInput: false, dataView: false, hoverGwei: 0 }
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

  setGasPrice (price, level) {
    if (price && price !== this.props.req.data.gasPrice) link.rpc('setGasPrice', price, level, this.props.req.handlerId, e => console.log(e))
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
        zIndex: 200000,
        left: '0px',
        right: '0px',
        padding: '100px 10px',
      }
    } else {
      return {
        transform: `translateY(${-190}px)`,
        zIndex: 1
      }
    }
  }

  hoverBar (hoverGasPercent) {
    console.log('this.store(main.connection.network)', this.store('main.connection.network'))
    const trader = this.store('main.gasPrice', this.store('main.connection.network'),'levels.trader')
    // const safelow = this.store('main.gasPrice.levels.safelow')
    const top = parseInt(trader, 16) * 4
    const bottom = 1 // parseInt(safelow, 16) / 10
    const percentBuffer = Math.round((bottom / top) * 100) / 100
    hoverGasPercent = hoverGasPercent + percentBuffer
    let gwei = Math.round(top * hoverGasPercent / 1000000000)
    gwei = gwei < bottom ? bottom : gwei
    console.log('hoverGasPrice', gwei * 1000000000)
    const hoverGasPrice = utils.numberToHex(gwei * 1000000000)
    hoverGasPercent = (hoverGasPrice / top) + percentBuffer
    const low = [0, 210, 180] // good
    const high = [33, 45, 46] // outerspace
    const w1 = hoverGasPercent
    const w2 = 1 - w1
    const hoverGasColor = `rgba(${Math.round(low[0] * w1 + high[0] * w2)}, ${Math.round(low[1] * w1 + high[1] * w2)}, ${Math.round(low[2] * w1 + high[2] * w2)}, 1)`
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

    const safelowFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.safelow, 16)))
    const safelowFeeUSD = safelowFee * etherUSD

    const normalFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.normal, 16)))
    const normalFeeUSD = normalFee * etherUSD

    const fastFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.fast, 16)))
    const fastFeeUSD = fastFee * etherUSD

    const traderFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(gasLevels.trader, 16)))
    const traderFeeUSD = traderFee * etherUSD

    const customFee = this.hexToDisplayValue(utils.numberToHex(parseInt(data.gas, 16) * parseInt(this.state.hoverGasPrice || data.gasPrice, 16)))
    const customFeeUSD = customFee * etherUSD

    const height = mode === 'monitor' ? '145px' : '360px'
    const style = this.expandFee(0, height)

    let slideLevel

    if (feeLevel === 'safelow') {
      slideLevel = '-10px'
    } else if (feeLevel === 'normal') {
      slideLevel = '-50px'
    } else if (feeLevel === 'fast') {
      slideLevel = '-90px'
    } if (feeLevel === 'trader') {
      slideLevel = '-130px'
    } else if (feeLevel === 'custom') {
      slideLevel = '-170px'
    }

    return (
      <div className='txSection txFee' style={style} onMouseDown={() => this.selectSection(0)}>
        <div className='txFeeGwei' style={{ opacity: expanded ? 1 : 0 }}>
          <div className='txFeeGweiValue'>
            {this.state.hoverGwei || (this.state.hoverGasPrice ? parseInt(this.state.hoverGasPrice, 'hex') / 1000000000  : false) || (parseInt(data.gasPrice, 'hex') / 1000000000) }
          </div>
          <div className='txFeeGweiLabel'>
            {'GWEI'}
          </div>
        </div>
        <div className='networkFeeLabel' style={{ transform: expanded ? 'translateY(0px)' : 'translateY(-40px)' }}>Fee</div>
        <div className='networkFeeOptions' style={!expanded ? { transitionDelay: '0s', transform: `translateY(${slideLevel})` } : { transform: 'translateY(0px)' }}>
          <div className='networkFeeOption' 
            onMouseDown={expanded ? () => this.setGasPrice(gasLevels.safelow, 'safelow') : null}
            onMouseEnter={expanded ? () => this.setState({ hoverGwei: parseInt(gasLevels.safelow, 'hex') / 1000000000 }) : null}
            onMouseLeave={expanded ? () => this.setState({ hoverGwei: 0 }) : null}
          >
            <div className='networkFeeOptionBack' /> 
            {this.renderFeeLabel(feeLevel === 'safelow', expanded)}
            <div className='txSectionLabelRight'>Safe Low</div>
            <div className={safelowFeeUSD > FEE_WARNING_THRESHOLD_USD || !safelowFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + safelowFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + safelowFeeUSD.toFixed(2)}</div>
            </div>
          </div>
          <div className='networkFeeOption' 
            onMouseDown={expanded ? () => this.setGasPrice(gasLevels.normal, 'normal') : null}
            onMouseEnter={expanded ? () => this.setState({ hoverGwei: parseInt(gasLevels.normal, 'hex') / 1000000000 }) : null}
            onMouseLeave={expanded ? () => this.setState({ hoverGwei: 0 }) : null}
          >
            <div className='networkFeeOptionBack' /> 
            {this.renderFeeLabel(feeLevel === 'normal', expanded)}
            <div className='txSectionLabelRight'>Normal</div>
            <div className={normalFeeUSD > FEE_WARNING_THRESHOLD_USD || !normalFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + normalFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + normalFeeUSD.toFixed(2)}</div>
            </div>
          </div>
          <div className='networkFeeOption' 
            onMouseDown={expanded ? () => this.setGasPrice(gasLevels.fast, 'fast') : null}
            onMouseEnter={expanded ? () => this.setState({ hoverGwei: parseInt(gasLevels.fast, 'hex') / 1000000000 }) : null}
            onMouseLeave={expanded ? () => this.setState({ hoverGwei: 0 }) : null}
          >
            <div className='networkFeeOptionBack' /> 
            {this.renderFeeLabel(feeLevel === 'fast', expanded)}
            <div className='txSectionLabelRight'>Fast</div>
            <div className={fastFeeUSD > FEE_WARNING_THRESHOLD_USD || !fastFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + fastFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + fastFeeUSD.toFixed(2)}</div>
            </div>
          </div>
          <div className='networkFeeOption' 
            onMouseDown={expanded ? () => this.setGasPrice(gasLevels.trader, 'trader') : null}
            onMouseEnter={expanded ? () => this.setState({ hoverGwei: parseInt(gasLevels.trader, 'hex') / 1000000000 }) : null}
            onMouseLeave={expanded ? () => this.setState({ hoverGwei: 0 }) : null}
          >
          <div className='networkFeeOptionBack' /> 
            {this.renderFeeLabel(feeLevel === 'trader', expanded)}
            <div className='txSectionLabelRight'>Trader</div>
            <div className={traderFeeUSD > FEE_WARNING_THRESHOLD_USD || !traderFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + traderFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + traderFeeUSD.toFixed(2)}</div>
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => { this.setGasPrice(this.state.hoverGasPrice, 'custom') } : null}
            onMouseEnter={expanded ? e => this.handleCustomPriceHover(e, true) : null}
            onMouseMove={expanded ? e => this.handleCustomPriceHover(e) : null}
            onMouseLeave={expanded ? e => this.handleCustomPriceHoverReset() : null}
          >
            <div className='networkFeeOptionBack' /> 
            {this.renderFeeLabel(feeLevel === 'custom', expanded)}
            <div className='txSectionLabelRight'>Custom</div>
            <div className={customFeeUSD > FEE_WARNING_THRESHOLD_USD || !customFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>{'Ξ ' + customFee}</div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>{'$ ' + customFeeUSD.toFixed(2)}</div>
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
    let notice = req.notice
    const status = req.status
    const mode = req.mode
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
                    <div className='approveRequestHeaderIcon'> {svg.octicon('radio-tower', { height: 22 })}</div>
                    <div className='approveRequestHeaderLabel'> {'Transaction'}</div>
                  </div>
                  <div className='transactionValue'>
                    <div className='transactionTotals'>
                      <div className='transactionTotalETH'>{'Ξ ' + value}</div>
                      <div className='transactionTotalUSD'>{'$ ' + (value * etherUSD).toFixed(2)}</div>
                    </div>
                    <div className='transactionSubtitle'>Value</div>
                  </div>
                  {this.renderFee()}
                  {utils.toAscii(req.data.data || '0x') ? (
                    <div className={this.state.dataView ? 'transactionData transactionDataSelected' : 'transactionData'}>
                      <div className='transactionDataHeader' onMouseDown={() => this.toggleDataView()}>
                        <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 22 })}</div>
                        <div className='transactionDataLabel'>View Data</div>
                        <div className='transactionDataIndicator'>{svg.octicon('chevron-down', { height: 22 })}</div>
                      </div>
                      <div className='transactionDataBody'>
                        <div className='transactionDataBodyInner'>
                          {req.data.data}
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
              <div className='requestSignButton'> {'Sign'} </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
