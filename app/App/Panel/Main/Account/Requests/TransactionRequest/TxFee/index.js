import React from 'react'
import Restore from 'react-restore'
import utils, { toHex } from 'web3-utils'
import svg from '../../../../../../../../resources/svg'
import link from '../../../../../../../../resources/link'
import { weiToGwei, gweiToWei, hexToInt, weiHexToGweiInt, gweiToWeiHex } from '../../../../../../../../resources/utils'

const FEE_WARNING_THRESHOLD_USD = 20
const FEE_MAX_TOTAL_ETH_WEI = 2 * 1e18

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

    this.chain = { 
      type: 'ethereum', 
      id: parseInt(this.props.req.data.chainId, 'hex').toString()
    }

    context.store.observer(() => {
      const { slow, standard, fast, asap } = context.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels')
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
          { opacity: '0.1', backgroundPosition: '0px 0px', offset: 0 },
          { opacity: '0.4', offset: 0.1 },
          { opacity: '0.4', offset: 0.9 },
          { opacity: '0.1', backgroundPosition: '0px 60px', offset: 1 }
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

  // barColor (percent) {
  //   const low = [250, 100, 155]
  //   const high = [250, 100, 155]
  //   const w1 = percent * 3 > 1 ? 1 : percent * 3
  //   const w2 = 1 - w1
  //   return `rgba(${Math.round(high[0] * w1 + low[0] * w2)}, ${Math.round(high[1] * w1 + low[1] * w2)}, ${Math.round(high[2] * w1 + low[2] * w2)}, ${percent < 0.5 ? 0.5 : percent})`
  // }

  trimWeiToGwei (level) {
    let gwei = parseFloat(weiToGwei(level).toFixed(3)) || 0
    let len = gwei.toString().length
    len = len > 5 ? 0 : len - 2
    len = len < 0 ? 0 : len
    let result = parseFloat(gwei.toFixed(len)) || 0
    if (result >= 10) {
      result = Math.ceil(result)
    } else if (result > 1) {
      result = Math.ceil(result * 10) / 10
    }
    return result
  }

  hoverBar (hoverGasPercent, isCustom) {
    if (!hoverGasPercent) hoverGasPercent = this.gasPriceToPercent(this.props.req.data.gas)
    hoverGasPercent = hoverGasPercent > 1 ? 1 : (hoverGasPercent < 0 ? 0 : hoverGasPercent)
    const hoverGasPercentOrigin = hoverGasPercent
    const asap = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels.asap')
    // const slow = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels.slow')
    const top = parseInt(asap, 'hex') * 2
    const bottom = 0
    let gwei = this.trimWeiToGwei(top * hoverGasPercent)
    gwei = gwei < weiToGwei(bottom) ? weiToGwei(bottom) : gwei
    const hoverGasPrice = utils.numberToHex(gwei * 1e9)
    hoverGasPercent = (hoverGasPrice / top) // + percentBuffer
    hoverGasPercent = (hoverGasPercent * 2) > 1 ? 1 : hoverGasPercent * 2
    // const diff = asap - slow
    // const adjustedGasPercent = hoverGasPrice / diff
    // const hoverGasColor = this.barColor(adjustedGasPercent)
    const hoverGasPriceCustom = isCustom ? hoverGasPrice : false
    this.setState({
      hoverGasPercentOrigin,
      hoverGasPercent,
      // hoverGasColor,
      hoverGasPrice,
      hoverGasPriceCustom,
      hoverGwei: gwei
    })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  handleCustomPriceHover (e, initial) {
    if (!this.state.hoverGasPercent && !initial) return
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left - 66
    this.setState({ hoverLevel: 'custom' })
    this.hoverBar((Math.round((x / (rect.width - 66 - 72)) * 100)) / 100, true)
  }

  handleCustomPriceHoverReset () {
    // const { data } = this.props.req
    // sthis.hoverBar(this.gasPriceToPercent(data.gasPrice))
    this.setState({
      hoverGasPrice: '',
      hoverGasPriceCustom: ''
    })
  }

  gasPriceToPercent (price) {
    const asap = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels.asap')
    return parseInt(price) / (parseInt(asap, 16) * 1.5)
  }

  renderFeeLabel (current, expanded, currentGas) {
    const levels = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels')
    const price = levels[current]
    let val
    if (current === 'custom') {
      val = this.trimWeiToGwei(parseInt(this.state.hoverGasPriceCustom || currentGas, 'hex'))
    } else {
      val = this.trimWeiToGwei(parseInt(price, 'hex'))
    }
    val = val < 1 ? '<1' : val
    return (
      <div className='txSectionLabelLeft'>
        <div className='txSectionLabelLeftInner' style={{ transform: 'translateX(0px)', opacity: 1 }}>
          {val}
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

  timeDisplay (sec, source) {
    if (!sec) {
      return { context: '', value: '?', unit: '', sec: 0 }
    } else if (sec < 60) {
      return { context: '~', value: sec, unit: 's', sec }
    } else if (sec < 3600) {
      return { context: '~', value: Math.round(sec / 60), unit: 'm', sec }
    } else {
      return { context: '~', value: Math.round(sec / 3600), unit: 'h', sec }
    }
  }

  checkGasMax (price, limit) {
    // Check hard limits of price and limit
    price = price > 9999 ? 9999 : price
    limit = limit > 12.5e6 ? 12.5e6 : limit
    if (price === weiHexToGweiInt(this.props.req.data.gasPrice)) { // If the price is unchanged, adjust limit
      if (gweiToWei(price) * limit > FEE_MAX_TOTAL_ETH_WEI) limit = Math.floor(FEE_MAX_TOTAL_ETH_WEI / gweiToWei(price))
    } else { // Adjust price, if price * limit is over fee max set price to highest possible
      if (gweiToWei(price) * limit > FEE_MAX_TOTAL_ETH_WEI) price = Math.floor(FEE_MAX_TOTAL_ETH_WEI / limit / 1e9)
    }
    return { price, limit }
  }

  setGasLimit (gasLimit) {
    if (!gasLimit) return this.setState({ inputLimit: 0 })
    gasLimit = hexToInt(gasLimit)
    const { limit } = this.checkGasMax(weiHexToGweiInt(this.props.req.data.gasPrice), gasLimit)
    this.setState({ inputLimit: limit })
    if (toHex(limit) !== this.props.req.data.gas) {
      link.rpc('setGasLimit', toHex(limit), this.props.req.handlerId, e => {
        if (e) {
          console.error(e)
          this.setState({ inputLimit: 0 })
        }
      })
    }
  }

  setGasPrice (netType, netId, gasPrice, level) {
    gasPrice = weiHexToGweiInt(gasPrice)
    if (isNaN(gasPrice)) return this.setState({ inputGwei: 0 })
    const { price } = this.checkGasMax(gasPrice, hexToInt(this.props.req.data.gas))
    this.setState({ inputGwei: parseFloat(price.toFixed(3)) })
    const feeLevel = this.store('main.networksMeta', netType, netId, 'gas.price.selected')
    if (gweiToWeiHex(price) && (gweiToWeiHex(price) !== this.props.req.data.gasPrice || level !== feeLevel)) {
      link.rpc('setGasPrice', netType, netId, gweiToWeiHex(price), level, this.props.req.handlerId, e => {
        if (e) {
          console.error(e)
          this.setState({ inputGwei: 0 })
        }
      })
    }
    // if (this.feeHaloClickRef && this.feeHaloClickRef.current) {
    //   setTimeout(() => {
    //     requestAnimationFrame(() => {
    //       this.feeHaloClickRef.current.animate(
    //         [
    //           { opacity: 0, transform: 'scale(1)' },
    //           { opacity: 0.7, transform: 'scale(1)' },
    //           { opacity: 0, transform: 'scale(1)' }
    //         ],
    //         { duration: 200, iterations: 1, easing: 'ease-out' }
    //       )
    //     })
    //   }, 10)
    // }
  }

  gasData (levels, gasLimit, etherUSD) {
    const gasLevels = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels')
    const feeData = {}
    levels.forEach(level => {
      feeData[level] = {}
      feeData[level].fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(gasLevels[level], 16)))
      feeData[level].feeUSD = (feeData[level].fee * etherUSD).toFixed(2)
      feeData[level].feeTime = this.timeDisplay(gasLevels[level + 'Time'], 'gasData ' + level)
    })
    return feeData
  }

  render () {
    const expanded = this.state.selectedIndex === 0
    const expandActive = this.state.expandActive
    const { data } = this.props.req

    let feeLevel = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.selected')
    const gasLevels = this.store('main.networksMeta', this.chain.type, this.chain.id, 'gas.price.levels')
    const { slowTime, standardTime, fastTime, asapTime, customTime } = gasLevels
    if (gasLevels[feeLevel] !== data.gasPrice) feeLevel = 'custom'
    // const req = this.props.req
    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const etherUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const gasLimit = this.state.inputLimit || (this.state.gasLimitInputFocus ? 0 : parseInt(data.gasLimit, 'hex'))

    const gasData = this.gasData(['slow', 'standard', 'fast', 'asap', 'custom'], gasLimit, etherUSD)
    gasData.custom.fee = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(this.state.hoverGasPriceCustom || data.gasPrice || 0, 'hex')))
    gasData.custom.feeUSD = (gasData.custom.fee * etherUSD).toFixed(2)
    gasData.custom.feeTime = this.timeDisplay(customTime, 'custom')

    const currentSymbol = this.store('main.networks', this.chain.type, this.chain.id,'symbol') || '?'
    let slideLevel, feeTotal, feeTotalUSD, feeTime
    const devHaloAdjust = -68
    const haloLevels = {
      slow: 148 + devHaloAdjust,
      standard: 188 + devHaloAdjust,
      fast: 228 + devHaloAdjust,
      asap: 268 + devHaloAdjust,
      custom: 308 + devHaloAdjust
    }
    const devAdjust = -301
    if (feeLevel === 'slow') {
      slideLevel = 170 + devAdjust
      // haloShadowLevel = `translateY(${haloLevels.slow}px)`
      feeTotal = gasData.slow.fee
      feeTotalUSD = gasData.slow.feeUSD
      feeTime = gasData.slow.feeTime
    } else if (feeLevel === 'standard') {
      slideLevel = 130 + devAdjust
      // haloShadowLevel = `translateY(${haloLevels.standard}px)`
      feeTotal = gasData.standard.fee
      feeTotalUSD = gasData.standard.feeUSD
      feeTime = gasData.standard.feeTime
    } else if (feeLevel === 'fast') {
      slideLevel = 90 + devAdjust
      // haloShadowLevel = `translateY(${haloLevels.fast}px)`
      feeTotal = gasData.fast.fee
      feeTotalUSD = gasData.fast.feeUSD
      feeTime = gasData.fast.feeTime
    } else if (feeLevel === 'asap') {
      slideLevel = 50 + devAdjust
      // haloShadowLevel = `translateY(${haloLevels.asap}px)`
      feeTotal = gasData.asap.fee
      feeTotalUSD = gasData.asap.feeUSD
      feeTime = gasData.asap.feeTime
    } else if (feeLevel === 'custom') {
      slideLevel = 10 + devAdjust
      // haloShadowLevel = `translateY(${haloLevels.custom}px)`
      feeTotal = gasData.custom.fee
      feeTotalUSD = gasData.custom.feeUSD
      feeTime = gasData.custom.feeTime
      if (feeTotal >= gasData.asap.fee) feeTime = gasData.asap.feeTime
      if (feeTotal < gasData.asap.fee) feeTime = gasData.fast.feeTime
      if (feeTotal < gasData.fast.fee) feeTime = gasData.standard.feeTime
      if (feeTotal < gasData.standard.fee) feeTime = gasData.slow.feeTime
      if (feeTotal < gasData.slow.fee) {
        feeTime = gasData.slow.feeTime
        feeTime.context = '>'
      }
    }

    const haloLevel = `translateY(${haloLevels[this.state.hoverLevel || feeLevel]}px)`

    const txFeeStyle = {}
    const optionsStyle = !expanded ? {
      transitionDelay: '0s',
      transform: `translateY(${slideLevel + 50}px)`
    } : {
      transform: 'translateY(0px)'
    }
    const marker = (this.state.hoverGasPercentOrigin * 210) + 5
    const gasPrice = this.trimWeiToGwei(parseInt(data.gasPrice, 'hex'))
    const gasLimitDisplay = this.state.pendingLimit || (this.state.gasLimitInputFocus ? (this.state.inputLimit || '') : parseInt(data.gas, 'hex'))

    // Adjust for any hover state
    if (this.state.hoverGwei || this.state.inputGwei) {
      feeTotal = this.hexToDisplayValue(utils.numberToHex(gweiToWei(this.state.hoverGwei || this.state.inputGwei) * gasLimit))
      feeTotalUSD = (feeTotal * etherUSD).toFixed(2)
    } else if (this.state.hoverGasPriceCustom) {
      feeTotal = this.hexToDisplayValue(utils.numberToHex(gasLimit * parseInt(this.state.hoverGasPriceCustom, 'hex')))
      feeTotalUSD = (feeTotal * etherUSD).toFixed(2)
      feeTime = gasData.custom.feeTime
    }

    feeTime = {}
    if (feeTotal >= gasData.asap.fee) feeTime = gasData.asap.feeTime
    if (feeTotal < gasData.asap.fee) feeTime = gasData.fast.feeTime
    if (feeTotal < gasData.fast.fee) feeTime = gasData.standard.feeTime
    if (feeTotal < gasData.standard.fee) feeTime = gasData.slow.feeTime
    if (feeTotal < gasData.slow.fee) {
      feeTime = gasData.slow.feeTime
      feeTime.context = '>'
    }

    // Set rocket height
    let rocketHeight = 0
    if (feeTime.sec >= gasData.asap.feeTime.sec) rocketHeight = 100
    if (feeTime.sec >= gasData.fast.feeTime.sec) rocketHeight = 75
    if (feeTime.sec >= gasData.standard.feeTime.sec) rocketHeight = 50
    if (feeTime.sec >= gasData.slow.feeTime.sec) rocketHeight = 25

    return (
      <div ref={this.feeWrapperRef} style={txFeeStyle} className={expanded ? 'txSection txFee txFeeExpanded' : 'txSection txFee'} onMouseDown={() => this.selectSection(0)}>
        <div className='txFeeHover' style={expanded ? { opacity: 0, pointerEvents: 'none' } : {}}>Adjust Gas Fee</div>
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
                value={this.state.inputGwei || (this.state.gasPriceInputFocus ? '' : gasPrice)}
                onChange={(e) => {
                  const inputGwei = parseInt(e.target.value) || 0
                  const price = inputGwei < 0 ? 0 : inputGwei > 9999 ? 9999 : inputGwei
                  this.setState({ inputGwei: price })
                  this.setGasPrice(this.chain.type, this.chain.id, gweiToWeiHex(price), 'custom')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.blur()
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const { inputGwei } = this.state
                    const price = inputGwei + 1 > 9999 ? 9999 : inputGwei + 1
                    this.setState({ inputGwei: price })
                     this.setGasPrice(this.chain.type, this.chain.id, gweiToWeiHex(price), 'custom')
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const { inputGwei } = this.state
                    const price = inputGwei - 1 < 0 ? 0 : inputGwei - 1
                    this.setState({ inputGwei: price })
                     this.setGasPrice(this.chain.type, this.chain.id, gweiToWeiHex(price), 'custom')
                  }
                }}
                onFocus={() => {
                  this.setState({ inputGwei: gasPrice, gasPriceInputFocus: true })
                }}
                onBlur={() => {
                  this.handleCustomPriceHoverReset()
                  this.setState({ hoverGwei: 0, hoverLevel: '', gasPriceInputFocus: false })
                  setTimeout(() => {
                    this.setState({ inputGwei: 0 })
                  }, 100)
                }}
              />
            </div>
            <div className='txFeeGweiLabel'>
              GAS PRICE (GWEI)
            </div>
          </div>
          <div className='txFeeLimit' style={{ opacity: expanded ? 1 : 0 }}>
            <div className='txFeeGweiValue'>
              <input
                tabIndex='-1'
                value={this.state.inputLimit || (this.state.gasLimitInputFocus ? '' : gasLimitDisplay)}
                onChange={(e) => {
                  let limit = parseInt(e.target.value) || 0
                  limit = limit > 12.5e6 ? 12.5e6 : limit
                  this.setState({ inputLimit: limit < 0 ? 0 : limit })
                  this.setGasLimit('0x' + parseInt(limit).toString(16))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.blur()
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const { inputLimit } = this.state
                    const limit = inputLimit + 1000 > 12.5e6 ? 12.5e6 : inputLimit + 1000
                    this.setState({ inputLimit: limit })
                    this.setGasLimit('0x' + parseInt(limit).toString(16))
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const { inputLimit } = this.state
                    const limit = inputLimit - 1000 < 0 ? 0 : inputLimit - 1000
                    this.setState({ inputLimit: limit })
                    this.setGasLimit('0x' + parseInt(limit).toString(16))
                  }
                }}
                onFocus={() => {
                  this.setState({ inputLimit: gasLimitDisplay || 0, gasLimitInputFocus: true })
                }}
                onBlur={() => {
                  this.setState({ gasLimitInputFocus: false })
                  setTimeout(() => {
                    this.setState({ inputLimit: 0 })
                  }, 100)
                }}
              />
            </div>
            <div className='txFeeGweiLabel'>
              GAS LIMIT (UNITS)
            </div>
          </div>
        </div>
        <div className={(this.state.hoverGwei || this.state.inputGwei || this.state.inputLimit || this.state.hoverGasPrice) ? 'txFeeSummary txFeeSummaryHover' : 'txFeeSummary'}>
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
          <div className={feeTotalUSD > FEE_WARNING_THRESHOLD_USD || !feeTotalUSD ? 'txFeeTotal txFeeTotalWarn' : 'txFeeTotal'} style={{ opacity: expanded ? 1 : 0 }}>
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
          <div className='customGasPriceBarInner' style={{ height: rocketHeight + '%' }}>
            <div className='customGasPriceBarRocket'>
              {svg.rocket(21)}
            </div>
            <div className='customGasPriceBarStreak' style={{ left: '-2px' }} />
            <div className='customGasPriceBarStreak' style={{ right: '-2px' }} />
          </div>
        </div>
        <div className='networkFeeLabel' style={{ transform: expanded ? 'translateY(0px)' : 'translateY(-40px)' }}>Fee</div>
        <div
          className='networkFeeSelectedHalo networkFeeSelectedHaloShadow'
          style={expandActive ? { transform: `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
        />
        <div className='networkFeeOptions' style={optionsStyle}>
          <div
            ref={this.realtimeValues.slow}
            className={this.state.hoverLevel === 'slow' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            style={{ opacity: !expanded && feeLevel !== 'slow' ? 0 : 1 }}
            onMouseDown={expanded ? () =>  this.setGasPrice(this.chain.type, this.chain.id, gasLevels.slow, 'slow') : null}
            onMouseEnter={expandActive ? () => {
              this.setState({ hoverLevel: 'slow', hoverGwei: parseInt(gasLevels.slow, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.slow))
            } : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'slow', hoverGwei: parseInt(gasLevels.slow, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.slow))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              if (!this.state.gasPriceInputFocus) this.setState({ inputGwei: '' })
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
                {gasData.slow.feeUSD}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.standard}
            className={this.state.hoverLevel === 'standard' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            style={{ opacity: !expanded && feeLevel !== 'standard' ? 0 : 1 }}
            onMouseDown={expanded ? () =>  this.setGasPrice(this.chain.type, this.chain.id, gasLevels.standard, 'standard') : null}
            onMouseEnter={expandActive ? () => {
              this.setState({ hoverLevel: 'standard', hoverGwei: parseInt(gasLevels.standard, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.standard))
            } : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'standard', hoverGwei: parseInt(gasLevels.standard, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.standard))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              if (!this.state.gasPriceInputFocus) this.setState({ inputGwei: '' })
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
                {gasData.standard.feeUSD}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.fast}
            className={this.state.hoverLevel === 'fast' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            style={{ opacity: !expanded && feeLevel !== 'fast' ? 0 : 1 }}
            onMouseDown={expanded ? () =>  this.setGasPrice(this.chain.type, this.chain.id, gasLevels.fast, 'fast') : null}
            onMouseEnter={expandActive ? () => {
              this.setState({ hoverLevel: 'fast', hoverGwei: parseInt(gasLevels.fast, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.fast))
            } : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'fast', hoverGwei: parseInt(gasLevels.fast, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.fast))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              if (!this.state.gasPriceInputFocus) this.setState({ inputGwei: '' })
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
                {gasData.fast.feeUSD}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.asap}
            className={this.state.hoverLevel === 'asap' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            style={{ opacity: !expanded && feeLevel !== 'asap' ? 0 : 1 }}
            onMouseDown={expanded ? () =>  this.setGasPrice(this.chain.type, this.chain.id, gasLevels.asap, 'asap') : null}
            onMouseEnter={expandActive ? () => {
              this.setState({ hoverLevel: 'asap', hoverGwei: parseInt(gasLevels.asap, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.asap))
            } : null}
            onMouseMove={expandActive ? () => {
              this.setState({ hoverLevel: 'asap', hoverGwei: parseInt(gasLevels.asap, 'hex') / 1000000000 })
              this.hoverBar(this.gasPriceToPercent(gasLevels.asap))
            } : null}
            onMouseLeave={expanded ? () => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              if (!this.state.gasPriceInputFocus) this.setState({ inputGwei: '' })
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
                {gasData.asap.feeUSD}
              </div>
            </div>
          </div>
          <div
            ref={this.realtimeValues.custom}
            className={this.state.hoverLevel === 'custom' ? 'networkFeeOption networkFeeOptionHover' : 'networkFeeOption'}
            onMouseDown={expanded ? () => {
               this.setGasPrice(this.chain.type, this.chain.id, this.state.hoverGasPrice, 'custom')
            } : null}
            onMouseEnter={expandActive ? e => {
              this.setState({ hoverLevel: 'custom' })
              this.handleCustomPriceHover(e, true)
            } : null}
            onMouseMove={expandActive ? e => {
              this.setState({ hoverLevel: 'custom' })
              this.handleCustomPriceHover(e, true)
            } : null}
            onMouseLeave={expanded ? e => {
              this.setState({ hoverLevel: '', hoverGwei: 0 })
              if (!this.state.gasPriceInputFocus) this.setState({ inputGwei: '' })
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
                {gasData.custom.feeUSD}
              </div>
            </div>
          </div>
        </div>
        <div
          className='networkFeeSelectedHalo'
          style={expandActive ? { transform: haloLevel || `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
        >
          <div className='customHaloMarker' style={this.state.hoverLevel === 'custom' ? { display: 'block' } : { display: 'none' }}>
            <div className='customHaloMarkerInner' style={{ transform: `translateX(${marker}px)` }}>
              <div className='customHaloMarkerLine' />
            </div>
          </div>
        </div>
        <div
          className='networkFeeSelectedHaloClickwrap'
          style={expandActive ? { transform: haloLevel || `translateY(${haloLevels[feeLevel]}px)`, opacity: 1 } : { transform: `translateY(${haloLevels[feeLevel] + slideLevel + 50}px)`, opacity: 0 }}
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

export default Restore.connect(TransactionFee)
