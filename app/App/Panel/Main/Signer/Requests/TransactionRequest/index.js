import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

import TxBar from './TxBar'

const weiToGwei = v => Math.ceil(v / 1e9)
const gweiToWei = v => Math.ceil(v * 1e9)

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

class TransactionFee extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.feeWrapperRef = React.createRef()
    this.feeUpdateRealtimeRef = React.createRef()
    this.feeHaloClickRef = React.createRef()
    this.realtimeValues = {
      slow: React.createRef(), 
      standard: React.createRef(), 
      fast: React.createRef(), 
      asap: React.createRef(),
      custom: React.createRef()
    }
    this.inital = true
    this.state = { hoverGwei: 0 }
    this.gasCache = {}
    context.store.observer(() => {
      const network = context.store('main.currentNetwork')
      const { slow, standard, fast, asap } = context.store('main.networks', network.type, network.id, 'gas.price.levels')
      let changed = false

      if (this.gasCache.slow !== slow && this.state.selectedIndex === 0) {
        this.valueUpdateAnimate(this.realtimeValues.slow, slow > this.gasCache.slow)
        this.gasCache.slow = slow
        changed = true
      }

      if (this.gasCache.standard !== standard && this.state.selectedIndex === 0) {
        this.valueUpdateAnimate(this.realtimeValues.standard, standard > this.gasCache.standard)
        this.gasCache.standard = standard
        changed = true
      }

      if (this.gasCache.fast !== fast && this.state.selectedIndex === 0) {
        this.valueUpdateAnimate(this.realtimeValues.fast, fast > this.gasCache.fast)
        this.gasCache.fast = fast
        changed = true
      }

      if (this.gasCache.asap !== asap && this.state.selectedIndex === 0) {
        this.valueUpdateAnimate(this.realtimeValues.asap, asap > this.gasCache.asap)
        this.gasCache.asap = asap
        changed = true
      }

      // let custom = ''

      // if (this.gasCache.custom !== custom) {
      //   this.valueUpdateAnimate(this.realtimeValues.custom)
      //   this.gasCache.custom = custom
      //   changed = true
      // }

      if (
        this.feeUpdateRealtimeRef &&
        this.feeUpdateRealtimeRef.current &&
        changed &&
        this.state.selectedIndex === 0
      ) {
        this.gasCache = { slow, standard, fast, asap }
        this.feeUpdateRealtimeRef.current.animate([
          { opacity: '0.2', backgroundPosition: '0px 0px', offset: 0 },
          { opacity: '1', offset: 0.1},
          { opacity: '1', offset: 0.9 },
          { opacity: '0.2', backgroundPosition: '0px 60px', offset: 1 }
        ], {
            duration: 2400,
            iterations: 1,
            easing: 'cubic-bezier(0,0,.12,1)'
          }
        )
      }
    })
  }
  mouseDetect (e) {
    if (this.feeWrapperRef && this.feeWrapperRef.current && !this.feeWrapperRef.current.contains(e.target)) {
      this.selectSection(-1)
      document.removeEventListener('mousedown', this.mouseDetect)
    }
  }

  selectSection (index) {
    this.setState({ selectedIndex: index })
    clearTimeout(this.expandActiveTimeout)
    if (index > -1) {
      document.addEventListener('mousedown', this.mouseDetect.bind(this))
      this.expandActiveTimeout = setTimeout(() => {
        this.setState({ expandActive: true })
      }, 600)
    } else {
      this.setState({ expandActive: false })
    }
    
    // if (index === this.state.selectedIndex) {
    //   this.setState({ selectedIndex: -1 })
    // } else {
    //   this.setState({ selectedIndex: index })
    // }
  }

  valueUpdateAnimate (ref, higher) {
    if (ref && ref.current) {
    ref.current.animate([
        {
          color: 'inherit',
          transform: 'scale(1)'
        },
        {
          color: higher ? 'rgb(250, 100, 155)' : 'rgb(0, 210, 180)',
          transform: 'scale(1)',
          offset: 0.01
        },
        {
          color: higher ? 'rgb(250, 100, 155)' : 'rgb(0, 210, 180)',
          transform: 'scale(1)',
          offset: 0.99
        },
        {
          color: 'inherit',
          transform: 'scale(1)'
        }
      ], {
        duration: 2400,
        iterations: 1,
        easing: 'cubic-bezier(.88,0,.12,1)'
      })
    }
  }

  barColor (percent) {
    const low = [250, 100, 155]
    const high = [250, 100, 155]
    const w1 = percent * 3 > 1 ? 1 : percent * 3
    const w2 = 1 - w1
    return `rgba(${Math.round(high[0] * w1 + low[0] * w2)}, ${Math.round(high[1] * w1 + low[1] * w2)}, ${Math.round(high[2] * w1 + low[2] * w2)}, ${percent < 0.5 ? 0.5 : percent})`
  }

  hoverBar (hoverGasPercent, isCustom) {
    hoverGasPercent = hoverGasPercent > 1 ? 1 : (hoverGasPercent < 0 ? 0 : hoverGasPercent)
    const hoverGasPercentOrigin = hoverGasPercent
    const network = this.store('main.currentNetwork')
    const asap = this.store('main.networks', network.type, network.id, 'gas.price.levels.asap')
    const slow = this.store('main.networks', network.type, network.id, 'gas.price.levels.slow')
    const top = parseInt(asap, 16) * 1.5
    const bottom = gweiToWei(1) 
    let gwei = Math.round(weiToGwei(top * hoverGasPercent))
    gwei = gwei < weiToGwei(bottom) ? weiToGwei(bottom) : gwei
    const hoverGasPrice = utils.numberToHex(gwei * 1000000000)
    hoverGasPercent = (hoverGasPrice / top) // + percentBuffer
    hoverGasPercent = (hoverGasPercent * 2) > 1 ? 1 : hoverGasPercent * 2
    const diff = asap - slow
    const adjustedGasPercent = hoverGasPrice / diff
    const hoverGasColor = this.barColor(adjustedGasPercent)
    const hoverGasPriceCustom = isCustom ? hoverGasPrice : false
    this.setState({
      hoverGasPercentOrigin,
      hoverGasPercent,
      hoverGasColor,
      hoverGasPrice,
      hoverGasPriceCustom
    })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  handleCustomPriceHover (e, initial) {
    if (!this.state.hoverGasPercent && !initial) return
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left - 66
    this.hoverBar((Math.round((x / (rect.width - 66 - 72)) * 100)) / 100, true)
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

  timeDisplay (sec) {
    if (!sec) {
      return {
        context: '',
        value: '?',
        unit: '',
        sec: 0
      }
    } else if (sec < 60) {
      return {
        context: '~',
        value: sec,
        unit: 's',
        sec
      }
    } else if (sec < 3600) {
      return {
        context: '~',
        value: Math.round(sec / 60),
        unit: 'm',
        sec
      }
    } else {
      return {
        context: '~',
        value: Math.round(sec / 3600),
        unit: 'h',
        sec
      }
    }
  }

  setGasLimit (limit) {
    // console.log('setGasLimit', limit, this.props.req.data.gas)
    // const network = this.store('main.currentNetwork')
    // const feeLevel = this.store('main.networks', network.type, network.id, 'gas.price.selected')
    if (limit && (limit !== this.props.req.data.gas)) {
      link.rpc('setGasLimit', limit, this.props.req.handlerId, e => {
        if (e) console.log(e)
        this.setState({ pendingLimit: 0 })
      })
    }
  }

  setGasPrice (netType, netId, price, level) {
    const network = this.store('main.currentNetwork')
    const feeLevel = this.store('main.networks', network.type, network.id, 'gas.price.selected')
    if (price && (price !== this.props.req.data.gasPrice || level !== feeLevel)) {
      link.rpc('setGasPrice', netType, netId, price, level, this.props.req.handlerId, e => {
        if (e) console.log(e)
        
      })
    }
    if (this.feeHaloClickRef && this.feeHaloClickRef.current) {
      this.feeHaloClickRef.current.animate(
        [
          {
            opacity: 1,
            transform: 'scale(1)'
          },
          {
            opacity: 0.5,
            transform: 'scale(2.5)'
          },
          {
            opacity: 0,
            transform: 'scale(3)'
          }
        ], {
          duration: 700,
          iterations: 1,
          easing: 'ease-out'
        }
      )
    }
    // this.setState({ expandActive: false })
    this.setState({ expandActive: false })
    // this.setState({ selectedIndex: -1 })
  }

  gasData (levels, gasLimit, etherUSD) {
    const network = this.store('main.currentNetwork')
    const gasLevels = this.store('main.networks', network.type, network.id, 'gas.price.levels')
    // const { slow, slowTime, standard, standardTime, fast, fastTime, asap, asapTime, customTime } = gasLevels
    const feeData = {}
    levels.forEach(level => {
      feeData[level] = {}
      feeData[level].fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(gasLevels[level], 16)))
      feeData[level].feeUSD = (feeData[level].fee * etherUSD).toFixed(2)
      feeData[level].feeTime = this.timeDisplay(gasLevels[level+'Time'])
    })
    return feeData
  }

  render () {
    const expanded = this.state.selectedIndex === 0
    const expandActive = this.state.expandActive
    const { data } = this.props.req
    const network = this.store('main.currentNetwork')
    let feeLevel = this.store('main.networks', network.type, network.id, 'gas.price.selected')
    const gasLevels = this.store('main.networks', network.type, network.id, 'gas.price.levels')
    const { slow, slowTime, standard, standardTime, fast, fastTime, asap, asapTime, customTime } = gasLevels
    if (gasLevels[feeLevel] !== data.gasPrice) feeLevel = 'custom'
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    // const gasLimit = parseInt(data.gas, 16)
    const gasLimit = this.state.pendingLimit || (this.state.gasLimitInputFocus ? 0 : parseInt(data.gas, 'hex'))

    const gasData = this.gasData(['slow', 'standard', 'fast', 'asap', 'custom'], gasLimit, etherUSD)

    console.log(gasData)
    
    // const gasData.slow.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(slow, 16)))
    // const gasData.slow.feeUSD = (gasData.slow.fee * etherUSD).toFixed(2)
    // const gasData.slow.feeTime = this.timeDisplay(slowTime)
    // const gasData.standard.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(standard, 16)))
    // const gasData.standard.feeUSD = (gasData.standard.fee * etherUSD).toFixed(2)
    // const gasData.standard.feeTime = this.timeDisplay(standardTime)
    // const gasData.fast.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(fast, 16)))
    // const gasData.fast.feeUSD = (gasData.fast.fee * etherUSD).toFixed(2)
    // const gasData.fast.feeTime = this.timeDisplay(fastTime)
    // const gasData.asap.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(asap, 16)))
    // const gasData.asap.feeUSD = (gasData.asap.fee * etherUSD).toFixed(2)
    // const gasData.asap.feeTime = this.timeDisplay(asapTime)
    gasData.custom.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(this.state.hoverGasPriceCustom || data.gasPrice, 'hex')))
    gasData.custom.feeUSD = (gasData.custom.fee * etherUSD).toFixed(2)
    gasData.custom.feeTime = this.timeDisplay(customTime)

    const currentSymbol = this.store('main.networks', network.type, network.id, 'symbol') || 'Ξ'

    let slideLevel, haloLevel, haloShadowLevel, feeTotal, feeTotalUSD, feeTime

    const devHaloAdjust = -75
    const haloLevels = {
      slow: 148 + devHaloAdjust,
      standard: 188 + devHaloAdjust,
      fast: 228 + devHaloAdjust,
      asap: 268 + devHaloAdjust,
      custom: 308 + devHaloAdjust
    }
    const devAdjust = -294
    if (feeLevel === 'slow') {
      slideLevel = 170 + devAdjust
      haloShadowLevel = `translateY(${haloLevels.slow}px)`
      feeTotal = gasData.slow.fee
      feeTotalUSD = gasData.slow.feeUSD
      feeTime = gasData.slow.feeTime
    } else if (feeLevel === 'standard') {
      slideLevel = 130 + devAdjust
      haloShadowLevel = `translateY(${haloLevels.standard}px)`
      feeTotal = gasData.standard.fee
      feeTotalUSD = gasData.standard.feeUSD
      feeTime = gasData.standard.feeTime
    } else if (feeLevel === 'fast') {
      slideLevel = 90 + devAdjust
      haloShadowLevel = `translateY(${haloLevels.fast}px)`
      feeTotal = gasData.fast.fee
      feeTotalUSD = gasData.fast.feeUSD
      feeTime = gasData.fast.feeTime
    } else if (feeLevel === 'asap') {
      slideLevel = 50 + devAdjust
      haloShadowLevel = `translateY(${haloLevels.asap}px)`
      feeTotal = gasData.asap.fee
      feeTotalUSD = gasData.asap.feeUSD
      feeTime = gasData.asap.feeTime
    } else if (feeLevel === 'custom') {
      slideLevel = 10 + devAdjust
      haloShadowLevel = `translateY(${haloLevels.custom}px)`
      feeTotal = gasData.custom.fee
      feeTotalUSD = gasData.custom.feeUSD
      feeTime = gasData.custom.feeTime
      if (feeTotal > gasData.asap.fee) feeTime = gasData.asap.feeTime
      if (feeTotal < gasData.asap.fee) feeTime = gasData.fast.feeTime
      if (feeTotal < gasData.fast.fee) feeTime = gasData.standard.feeTime
      if (feeTotal < gasData.standard.fee) feeTime = gasData.slow.feeTime
      if (feeTotal < gasData.slow.fee) {
        feeTime = gasData.slow.feeTime
        feeTime.context = '>'
      }
    }

    let rocketHeight = 0

    console.log('feeTime.sec', feeTime.sec)
    console.log('gasData.asap.feeTime.sec', gasData.asap.feeTime.sec)

    if (feeTime.sec >= gasData.asap.feeTime.sec) rocketHeight = 100
    if (feeTime.sec >= gasData.fast.feeTime.sec) rocketHeight = 75
    if (feeTime.sec >= gasData.standard.feeTime.sec) rocketHeight = 50
    if (feeTime.sec >= gasData.slow.feeTime.sec) rocketHeight = 25

    console.log('rocketHeight', rocketHeight)
 
    haloLevel = `translateY(${haloLevels[this.state.hoverLevel || feeLevel]}px)`

    let txFeeStyle = {}
    let optionsStyle = !expanded ? { transitionDelay: '0s', transform: `translateY(${slideLevel + 50}px)` } : { transform: 'translateY(0px)' } 
    if (this.state.hoverLevel || this.state.hoverGwei) {
      // txFeeStyle = { boxShadow: '0px 35px 50px -45px rgba(16, 44, 100, 0.3), 0px -35px 50px -45px rgba(16, 44, 100, 0.3)' }
      optionsStyle.transform = optionsStyle.transform
      // optionsStyle.boxShadow = '0px 0px 40px -20px rgba(20, 40, 130, 0.4), 0px 0px -40px -20px rgba(20, 40, 130, 0.1)'
    }

    const marker = this.state.hoverGasPercentOrigin * (308 - 66 - 72)
    // const gasPrice = this.state.hoverGwei || (this.state.gasPriceInputFocus ? '' : (this.state.hoverGasPrice ? parseInt(this.state.hoverGasPrice, 'hex') / 1000000000 : false) || 
    const gasPrice = (parseInt(data.gasPrice, 'hex') / 1000000000)
    const gasLimitDisplay = this.state.pendingLimit || (this.state.gasLimitInputFocus ? (parseInt(data.gas, 'hex') || '') : parseInt(data.gas, 'hex'))

    console.log('gasLimit',  gasLimit )

    if (this.state.hoverGwei) {
      feeTotal = this.hexToDisplayValue(utils.numberToHex(gweiToWei(this.state.hoverGwei) * gasLimit))
      feeTotalUSD = (feeTotal * etherUSD).toFixed(2)
      console.log('this.state.hoverLevel', gasData[this.state.hoverLevel])
      feeTime = gasData[this.state.hoverLevel].feeTime
    } else if (this.state.hoverGasPriceCustom) {
      feeTotal = gasData.custom.fee
      feeTotalUSD = (feeTotal * etherUSD).toFixed(2)
      feeTime = gasData.custom.feeTime
    }
    console.log('this.state.hoverGwei', this.hexToDisplayValue(utils.numberToHex(gweiToWei(this.state.hoverGwei) * gasLimit)))

    return (
      <div ref={this.feeWrapperRef} style={txFeeStyle} className={expanded ? 'txSection txFee txFeeExpanded' : 'txSection txFee'} onMouseDown={() => this.selectSection(0)}>
        <div className='txFeeTitle'>Fee</div>
        <div className='txFeeUpdateRealtime'>
          <div ref={this.feeUpdateRealtimeRef} className='txFeeUpdateRealtimeInner'>
            <div className='txFeeUpdateRealtimeTitle'>Gas Data Update</div>
          </div>
        </div>
        
        <div className='txFeeInputs'>
          <div className='txFeeGwei' style={{ opacity: expanded ? 1 : 0 }}>
            <div className='txFeeGweiValue'>
              <input 
                tabIndex='-1' 
                value={gasPrice} 
                onChange={(e) => {
                  this.setState({ hoverGwei: parseInt(e.target.value) })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    this.setGasPrice(network.type, network.id, '0x' + gweiToWei(parseInt(this.state.hoverGwei)).toString(16), 'custom')
                    e.target.blur()
                  }
                }}
                onMouseLeave={e => {
                  e.target.blur()
                }}
                onFocus={(e) => {
                  this.setState({hoverGwei: 0, gasPriceInputFocus: true})
                }}
                onBlur={(e) => {
                  this.handleCustomPriceHoverReset()
                  this.setState({ gasPriceInputFocus: false})
                }}
              />
            </div>
            <div className='txFeeGweiLabel'>
              PRICE (GWEI)
            </div>
          </div>
          <div className='txFeeLimit' style={{ opacity: expanded ? 1 : 0 }}>
            <div className='txFeeGweiValue'>
              <input 
                tabIndex='-1' 
                value={gasLimitDisplay}
                onChange={(e) => {
                  let pendingLimit = parseInt(e.target.value || '0') 
                  pendingLimit = pendingLimit > 12.5e6 ? 12.5e6 : pendingLimit
                  this.setState({ pendingLimit })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    this.setGasLimit('0x' + parseInt(this.state.pendingLimit).toString(16))
                    e.target.blur()
                  }
                }}
                onMouseLeave={e => {
                  e.target.blur()
                }}
                onFocus={(e) => {
                  this.setState({ gasLimitInputFocus: true })
                }}
                onBlur={(e) => {
                  this.setState({ gasLimitInputFocus: false })
                }}
              />
            </div>
            <div className='txFeeGweiLabel'>
              LIMIT (UNITS)
            </div>
          </div>
        </div>
        <div className={(this.state.hoverGwei || this.state.hoverGasPrice) ? 'txFeeSummary txFeeSummaryHover' : 'txFeeSummary'}>
          <div className='txFeeTime' style={{ opacity: expanded ? 1 : 0 }}>
            <div className='txFeeSummaryValue'>
              <div className='txFeeSummaryTimeContext'>{feeTime.context}</div>
              <div className='txFeeSummaryTimeValue'>{feeTime.value}</div>
              <div className='txFeeSummaryTimeUnit'>{feeTime.unit}</div>
            </div>
            <div className='txFeeSummaryLabel'>
              TIME
            </div>
          </div>
          <div className='txFeeTotal' style={{ opacity: expanded ? 1 : 0 }}>
            <div className='txFeeSummaryValue'>
              <span className='txFeeSummarySymbol'>{currentSymbol}</span>
              <span className='txFeeSummaryTotal'>{feeTotal}</span>
              <span className='txFeeSummaryEquivalentSymbol'>≈</span>
              <span className='txFeeSummaryUSDSymbol'>$</span>
              <span className='txFeeSummaryTotalUSD'>{feeTotalUSD}</span>
            </div>
            <div className='txFeeSummaryLabel'>
              MAX FEE
            </div>
          </div>
        </div>
        <div className='customGasPriceBar'>
          <div className='customGasPriceBarInner' style={{ background: this.state.hoverGasColor, height: rocketHeight + '%' }}>
            <div className='customGasPriceBarRocket' style={{ color: this.state.hoverGasColor }}>
              {svg.rocket(21)}
            </div>
            <div className='customGasPriceBarStreak' style={{ background: this.state.hoverGasColor, left: '-2px' }} />
            <div className='customGasPriceBarStreak' style={{ background: this.state.hoverGasColor, right: '-2px' }} />
          </div>
        </div>
        <div className='networkFeeLabel' style={{ transform: expanded ? 'translateY(0px)' : 'translateY(-40px)' }}>Fee</div>
        <div
          className='networkFeeSelectedHalo networkFeeSelectedHaloShadow'
          style={expanded ? { transform: `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
        />
        <div className='networkFeeOptions' style={optionsStyle}>
          <div
            ref={this.realtimeValues.slow}
            className={this.state.hoverLevel === 'slow' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.slow, 'slow') : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'slow', hoverGwei: parseInt(gasLevels.slow, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.slow))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionHoverInset' />
            {this.renderFeeLabel('slow', expanded)}
            <div className='txSectionLabelRight'>Slow</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(slowTime)}</div>
            <div className={gasData.slow.feeUSD > FEE_WARNING_THRESHOLD_USD || !gasData.slow.feeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{gasData.slow.fee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>$</span>
                {network.id === '1' ? gasData.slow.feeUSD : '?'}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.standard}
            className={this.state.hoverLevel === 'standard' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.standard, 'standard') : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'standard', hoverGwei: parseInt(gasLevels.standard, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.standard))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionHoverInset' />
            {this.renderFeeLabel('standard', expanded)}
            <div className='txSectionLabelRight'>Medium</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(standardTime)}</div>
            <div className={gasData.standard.feeUSD > FEE_WARNING_THRESHOLD_USD || !gasData.standard.feeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{gasData.standard.fee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>$</span>
                {network.id === '1' ? gasData.standard.feeUSD : '?'}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.fast}
            className={this.state.hoverLevel === 'fast' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.fast, 'fast') : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'fast', hoverGwei: parseInt(gasLevels.fast, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.fast))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionHoverInset' />
            {this.renderFeeLabel('fast', expanded)}
            <div className='txSectionLabelRight'>Fast</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(fastTime)}</div>
            <div className={gasData.fast.feeUSD > FEE_WARNING_THRESHOLD_USD || !gasData.fast.feeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{gasData.fast.fee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>$</span>
                {network.id === '1' ? gasData.fast.feeUSD : '?'}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.asap}
            className={this.state.hoverLevel === 'asap' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => this.setGasPrice(network.type, network.id, gasLevels.asap, 'asap') : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'asap', hoverGwei: parseInt(gasLevels.asap, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.asap))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionHoverInset' />
            {this.renderFeeLabel('asap', expanded)}
            <div className='txSectionLabelRight'>ASAP</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(asapTime)}</div>
            <div className={gasData.asap.feeUSD > FEE_WARNING_THRESHOLD_USD || !gasData.asap.feeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{gasData.asap.fee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>$</span>
                {network.id === '1' ? gasData.asap.feeUSD : '?'}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.custom}
            className={this.state.hoverLevel === 'custom' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => {
              this.setGasPrice(network.type, network.id, this.state.hoverGasPrice, 'custom')
            } : null}
            onMouseMove={expandActive ? e => {
              this.setState({ hoverLevel: 'custom' })
              this.handleCustomPriceHover(e, true)
            } : null}
            // onMouseMove={expanded ? e => this.handleCustomPriceHover(e) : null}
            onMouseLeave={expanded ? e => {
              this.setState({ hoverLevel: '' })
              this.handleCustomPriceHoverReset()
            } : null}
          >
            <div className='networkFeeOptionHoverInset' />
            {this.renderFeeLabel('custom', expanded, data.gasPrice)}
            <div className='txSectionLabelRight'>Custom</div>
            <div className='txSectionLabelTime'>{this.renderFeeTime(customTime)}</div>
            <div className={gasData.custom.feeUSD > FEE_WARNING_THRESHOLD_USD || !gasData.custom.feeUSD ? 'networkFeeTotal networkFeeTotalWarn' : 'networkFeeTotal'}>
              <div className='networkFeeTotalSection networkFeeTotalETH'>
                <span className='networkFeeSymbol'>{currentSymbol}</span>
                <span>{gasData.custom.fee}</span>
              </div>
              <div className='networkFeeTotalSection networkFeeTotalApprox'>≈</div>
              <div className='networkFeeTotalSection networkFeeTotalUSD'>
                <span className='networkFeeSymbolUSD'>$</span>
                {network.id === '1' ? gasData.custom.feeUSD : '?'}
              </div>
            </div>
          </div>
        </div>
        <div
          className='networkFeeSelectedHalo'
          style={expanded ? { transform: haloLevel || `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
          // style={expanded ? { transform: haloLevel || haloShadowLevel, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
        >
          <div className='customHaloMarker' style={this.state.hoverLevel === 'custom' ? { display: 'block' } : { display: 'none' }}>
            <div className='customHaloMarkerInner' style={{ transform: `translateX(${marker}px)` }}>
              <div className='customHaloMarkerLine' />
            </div>
          </div>
        </div>
        <div
          className='networkFeeSelectedHalo networkFeeSelectedHaloClickwrap'
          style={expanded ? { transform: haloLevel || `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
          // style={expanded ? { transform: haloLevel || haloShadowLevel, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
        >
          <div
            ref={this.feeHaloClickRef}
            className='networkFeeSelectedHaloClick'
          />
        </div>
      </div>
    )
  }
}

const Fee = Restore.connect(TransactionFee)


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
                  <Fee {...this.props} />
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
