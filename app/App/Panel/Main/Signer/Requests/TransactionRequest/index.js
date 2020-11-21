import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

import TxBar from './TxBar'

const weiToGwei = v => Math.ceil(v / 1e9)

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

  setGasPrice (netType, netId, price, level) {
    const network = this.store('main.currentNetwork')
    const feeLevel = this.store('main.networks', network.type, network.id, 'gas.price.selected')
    if (price && (price !== this.props.req.data.gasPrice || level !== feeLevel)) {
      link.rpc('setGasPrice', netType, netId, price, level, this.props.req.handlerId, e => {
        if (e) console.log(e)
      })
    }
    // this.setState({ selectedIndex: -1 })
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
    this.setState({ selectedIndex: index })
    // if (index === this.state.selectedIndex) {
    //   this.setState({ selectedIndex: -1 })
    // } else {
    //   this.setState({ selectedIndex: index })
    // }
  }

  barColor (percent) {
    const low = [0, 210, 180] // good
    const high = [0, 105, 90] // outerspace
    const w1 = percent
    const w2 = 1 - w1
    return `rgba(${Math.round(low[0] * w1 + high[0] * w2)}, ${Math.round(low[1] * w1 + high[1] * w2)}, ${Math.round(low[2] * w1 + high[2] * w2)}, 1)`
  }

  hoverBar (hoverGasPercent, isCustom) {
    const network = this.store('main.currentNetwork')
    const asap = this.store('main.networks', network.type, network.id, 'gas.price.levels.asap')
    const top = parseInt(asap, 16) * 2
    const bottom = 1 // parseInt(slow, 16) / 10
    const percentBuffer = Math.round((bottom / top) * 100) / 100
    hoverGasPercent = hoverGasPercent + percentBuffer
    let gwei = Math.round(top * hoverGasPercent / 1000000000)
    gwei = gwei < bottom ? bottom : gwei
    const hoverGasPrice = utils.numberToHex(gwei * 1000000000)
    hoverGasPercent = (hoverGasPrice / top) + percentBuffer
    const hoverGasColor = this.barColor(hoverGasPercent)
    const hoverGasPriceCustom = isCustom ? hoverGasPrice : false
    this.setState({ 
      hoverGasPercent, 
      hoverGasColor, 
      hoverGasPrice, 
      hoverGasPriceCustom
    })
  }

  handleCustomPriceHover (e, initial) {
    if (!this.state.hoverGasPercent && !initial) return
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    this.hoverBar((Math.round((x / rect.width) * 100)) / 100, true)
  }

  handleCustomPriceHoverReset () {
    const { data } = this.props.req
    this.hoverBar(this.gasPriceToPercent(data.gasPrice))
    this.setState({ 
      hoverGasPrice: '', 
      hoverGasPriceCustom: ''
    })
  }

  gasPriceToPercent (price) {
    const network = this.store('main.currentNetwork')
    const asap = this.store('main.networks', network.type, network.id, 'gas.price.levels.asap')
    return parseInt(price) / (parseInt(asap, 16) * 2)
  }

  renderFeeLabel (current, expanded, currentGas) {
    const network = this.store('main.currentNetwork')        
    const levels = this.store('main.networks', network.type, network.id, 'gas.price.levels')
    const price = levels[current]
    return (
      <div className='txSectionLabelLeft'>
        <div className='txSectionLabelLeftInner' style={{ transform: 'translateX(0px)', opacity: 1 }}>
          {current === 'custom' ? (
            weiToGwei(parseInt(this.state.hoverGasPriceCustom || currentGas, 'hex'))
          ) : (
            weiToGwei(parseInt(price, 'hex'))
          )}
          <span className='gwei'>GWEI</span>
        </div>
      </div>
    )
  }

  renderFeeTime (time) {
    if (!time) return <>?<span className='timeUnit'>?</span></>
    if (time < 60) return <>{time}<span className='timeUnit'>s</span></>
    if (time < 3600) return <>{Math.round(time / 60)}<span className='timeUnit'>m</span></>
    return <>{Math.round(time / 3600)}<span className='timeUnit'>h</span></>
  }

  renderFee () {
    const expanded = this.state.selectedIndex === 0
    const { data } = this.props.req
    const network = this.store('main.currentNetwork')
    let feeLevel = this.store('main.networks', network.type, network.id, 'gas.price.selected')
    const gasLevels = this.store('main.networks', network.type, network.id, 'gas.price.levels')
    const {slow, slowTime, standard, standardTime, fast, fastTime, asap, asapTime, customTime} = gasLevels
    if (gasLevels[feeLevel] !== data.gasPrice) feeLevel = 'custom'
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    const gasLimit = parseInt(data.gas, 16)
    const slowFee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(slow, 16)))
    const slowFeeUSD = slowFee * etherUSD
    // const slowFeeTime = !slowTime ? '?s' : slowTime < 60 ? slowTime + 's' : slowTime < 3600 ? slowTime / 60 + 'm' : slowTime / 3600 + 'h'
    const standardFee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(standard, 16)))
    const standardFeeUSD = standardFee * etherUSD
    // const standardFeeTime = !standardTime ? '?s' : standardTime < 60 ? standardTime + 's' : standardTime < 3600 ? standardTime / 60 + 'm' : standardTime / 3600 + 'h'
    const fastFee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(fast, 16)))
    const fastFeeUSD = fastFee * etherUSD
    // const fastFeeTime = !fastTime ? '?s' : fastTime < 60 ? fastTime + 's' : fastTime < 3600 ? fastTime / 60 + 'm' : fastTime / 3600 + 'h'
    const asapFee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(asap, 16)))
    const asapFeeUSD = asapFee * etherUSD
    // const asapFeeTime = !asapTime ? '?s' : asapTime < 60 ? asapTime + 's' : asapTime < 3600 ? asapTime / 60 + 'm' : asapTime / 3600 + 'h'
    const customFee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(this.state.hoverGasPriceCustom || data.gasPrice, 16)))
    const customFeeUSD = customFee * etherUSD
    // const customFeeTime = !customTime ? '?s' : customTime < 60 ? customTime + 's' : customTime < 3600 ? customTime / 60 + 'm' : asapTime / 3600 + 'h'
    
    // console.log('-')

    // const height = mode === 'monitor' ? '145px' : '360px'
    // const style = this.expandFee(0, height)

    const currentSymbol = this.store('main.networks', network.type, network.id, 'symbol') || 'Ξ'

    let slideLevel, haloLevel, haloShadowLevel

    if (feeLevel === 'slow') {
      slideLevel = '-10px'
      haloShadowLevel = 'translateY(118px)'
    } else if (feeLevel === 'standard') {
      slideLevel = '-50px'
      haloShadowLevel = 'translateY(158px)'
    } else if (feeLevel === 'fast') {
      slideLevel = '-90px'
      haloShadowLevel = 'translateY(198px)'
    } else if (feeLevel === 'asap') {
      slideLevel = '-130px'
      haloShadowLevel = 'translateY(238px)'
    } else if (feeLevel === 'custom') {
      slideLevel = '-170px'
      haloShadowLevel = 'translateY(278px)'
    }

    let hoverLevel = this.state.hoverLevel

    if (hoverLevel === 'slow') {
      haloLevel = 'translateY(118px)'
    } else if (hoverLevel === 'standard') {
      haloLevel = 'translateY(158px)'
    } else if (hoverLevel === 'fast') {
      haloLevel = 'translateY(198px)'
    } else if (hoverLevel === 'asap') {
      haloLevel = 'translateY(238px)'
    } else if (hoverLevel === 'custom') {
      haloLevel = 'translateY(278px)'
    }

    return (
      <div className={expanded ? 'txSection txFee txFeeExpanded' : 'txSection txFee'} onMouseDown={() => this.selectSection(0)}>
        <div className='txFeeGwei' style={{ opacity: expanded ? 1 : 0 }}>
          <div className='txFeeGweiValue'>
            {this.state.hoverGwei || (this.state.hoverGasPrice ? parseInt(this.state.hoverGasPrice, 'hex') / 1000000000 : false) || (parseInt(data.gasPrice, 'hex') / 1000000000)}
          </div>
          <div className='txFeeGweiLabel'>
            GWEI
          </div>
        </div>
        <div className='txFeeLimit' style={{ opacity: expanded ? 1 : 0 }}>
          <div className='txFeeGweiValue'>
            {parseInt(gasLimit, 'hex')}
          </div>
          <div className='txFeeGweiLabel'>
            LIMIT
          </div>
        </div>
        <div className='txFeeTotal' style={{ opacity: expanded ? 1 : 0 }}>
          <div className='txFeeGweiValue'>
            {this.state.hoverGwei || (this.state.hoverGasPrice ? parseInt(this.state.hoverGasPrice, 'hex') / 1000000000 : false) || (parseInt(data.gasPrice, 'hex') / 1000000000)}
          </div>
          <div className='txFeeGweiLabel'>
            TOTAl
          </div>
        </div>
        <div className='customGasPriceBar'>
          <div className='customGasPriceBarInner' style={{ background: this.state.hoverGasColor, width: ((this.state.hoverGasPercent * 100) + 5) + '%', transform: 'translateX(-50%)', left: '50%' }} />
        </div>
        <div className='networkFeeLabel' style={{ transform: expanded ? 'translateY(0px)' : 'translateY(-40px)' }}>Fee</div>
        <div 
          className='networkFeeSelectedHalo networkFeeSelectedHaloShadow' 
          style={expanded ? { transform: haloShadowLevel, opacity: 1 } : { transform: 'translateY(-100px)', opacity: 0 } }
        />
        <div className='networkFeeOptions' style={!expanded ? { transitionDelay: '0s', transform: `translateY(${slideLevel})` } : { transform: 'translateY(0px)' }}>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.slow, 'slow') : null}
            onMouseMove={expanded ? () => {
              this.setState({ hoverLevel: 'slow', hoverGwei: parseInt(gasLevels.slow, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.slow))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionBack' />
            {this.renderFeeLabel('slow', expanded)}
            <div className='txSectionLabelRight'>Slow</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(slowTime)}</div>
            <div className={slowFeeUSD > FEE_WARNING_THRESHOLD_USD || !slowFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{slowFee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>{'$'}</span>
                {network.id === '1' ? slowFeeUSD.toFixed(2) : '?'}
              </div>
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.standard, 'standard') : null}
            onMouseMove={expanded ? () => {
              this.setState({ hoverLevel: 'standard', hoverGwei: parseInt(gasLevels.standard, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.standard))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionBack' />
            {this.renderFeeLabel('standard', expanded)}
            <div className='txSectionLabelRight'>Medium</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(standardTime)}</div>
            <div className={standardFeeUSD > FEE_WARNING_THRESHOLD_USD || !standardFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{standardFee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>{'$'}</span>
                {network.id === '1' ? standardFeeUSD.toFixed(2) : '?'}
              </div>
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.fast, 'fast') : null}
            onMouseMove={expanded ? () => {
              this.setState({ hoverLevel: 'fast', hoverGwei: parseInt(gasLevels.fast, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.fast))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionBack' />
            {this.renderFeeLabel('fast', expanded)}
            <div className='txSectionLabelRight'>Fast</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(fastTime)}</div>
            <div className={fastFeeUSD > FEE_WARNING_THRESHOLD_USD || !fastFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{fastFee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>{'$'}</span>
                {network.id === '1' ? fastFeeUSD.toFixed(2) : '?'}
              </div>
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.asap, 'asap') : null}
            onMouseMove={expanded ? () => {
              this.setState({ hoverLevel: 'asap', hoverGwei: parseInt(gasLevels.asap, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.asap))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionBack' />
            {this.renderFeeLabel('asap', expanded)}
            <div className='txSectionLabelRight'>ASAP</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(asapTime)}</div>
            <div className={asapFeeUSD > FEE_WARNING_THRESHOLD_USD || !asapFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{asapFee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>{'$'}</span>
                {network.id === '1' ? asapFeeUSD.toFixed(2) : '?'}
              </div>
            </div>
          </div>
          <div
            className='networkFeeOption'
            onMouseDown={expanded ? () => { 
              this.setGasPrice(network.type, network.id, this.state.hoverGasPrice, 'custom') } : null}
            onMouseMove={expanded ? e => {
              this.setState({ hoverLevel: 'custom' })
              this.handleCustomPriceHover(e, true) 
            } : null}
            // onMouseMove={expanded ? e => this.handleCustomPriceHover(e) : null}
            onMouseLeave={expanded ? e => {
              this.setState({ hoverLevel: '' })
              this.handleCustomPriceHoverReset() 
            } : null}
          >
            <div className='networkFeeOptionBack' />
            {this.renderFeeLabel('custom', expanded, data.gasPrice)}
            <div className='txSectionLabelRight'>Custom</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(customTime)}</div>
            <div className={customFeeUSD > FEE_WARNING_THRESHOLD_USD || !customFeeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{customFee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>{'$'}</span>
                {network.id === '1' ? customFeeUSD.toFixed(2) : '?'}
              </div>
            </div>
          </div>
        </div>
        <div 
          className='networkFeeSelectedHalo' 
          style={expanded ? { transform: haloLevel || haloShadowLevel, opacity: 1 } : { transform: 'translateY(-100px)', opacity: 0 } } 
        />
      </div>
    )
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
                          className='txAugmentSpeedUp animate__flipInX' onMouseDown={() => {
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
                  {this.renderFee()}
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
