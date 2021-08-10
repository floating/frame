import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'
import { weiToGwei, hexToInt } from '../../../../../../resources/utils'

class Gas extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      expand: false
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 
  renderFeeTime (time) {
    if (!time) return <>?<span className='timeUnit'>?</span></>
    if (time < 60) return <><span className='timeUnit'>~</span>{time}<span className='timeUnit'>s</span></>
    if (time < 3600) return <><span className='timeUnit'>~</span>{Math.round(time / 60)}<span className='timeUnit'>m</span></>
    return <><span className='timeUnit'>~</span>{Math.round(time / 3600)}<span className='timeUnit'>h</span></>
  }
  toDisplayUSD (bn) {
    return parseFloat(
      bn.toNumber() >= 1 ? bn.toFixed(0, BigNumber.ROUND_UP).toString() :
      bn.toFixed(2, BigNumber.ROUND_UP).toString()     
    )
  }
  roundGwei (gwei) {
    if (gwei && gwei < 0.001) return '‹0.001'
    return parseFloat(
      gwei >= 10 ? Math.round(gwei) :
      gwei >= 5 ? Math.round(gwei * 10) / 10 :
      gwei >= 1 ? Math.round(gwei * 100) / 100 :
      Math.round(gwei * 1000) / 1000
    )
  }
  levelDisplay (level) {
    const gwei = weiToGwei(hexToInt(level)) 
    return this.roundGwei(gwei) || 0
  }
  addBufferBaseFee (base) {
    return '0x' + Math.round(hexToInt(base) * 1.05).toString(16)
  }
  txEstimate (value, gasLimit, nativeUSD) {
    return this.toDisplayUSD(BigNumber(value * gasLimit).shiftedBy(-9).multipliedBy(nativeUSD))
  }
  render () {
    const { type, id } = this.store('main.currentNetwork')
    const levels = this.store('main.networksMeta', type, id, 'gas.price.levels')
    const fees = this.store('main.networksMeta', type, id, 'gas.price.fees')
    const gasPrice = this.levelDisplay(levels.fast)

    const { maxBaseFeePerGas, maxPriorityFeePerGas } = (fees || {})

    const priorityFee = this.levelDisplay(maxPriorityFeePerGas)
    const maxFee = this.levelDisplay(gasPrice)

    const actualBaseFee = this.roundGwei(((weiToGwei(hexToInt(maxBaseFeePerGas)) / 21 * 20) / 9) * 8 / 9 * 8)

    const lowFee = this.roundGwei(actualBaseFee + priorityFee)
    const layer = this.store('main.networks', type, id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', type, id, 'nativeCurrency')
    const nativeUSD = BigNumber(nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0)

    const low = fees ? lowFee : gasPrice
    const high = fees ? maxFee : gasPrice
    const feeEstimatesUSD = [
      {
        low: this.txEstimate(low, 21 * 1000, nativeUSD),
        high: this.txEstimate(high, 21 * 1000, nativeUSD),
        label: 'Send ETH'
      }, 
      {
        low: this.txEstimate(low, 65 * 1000, nativeUSD),
        high: this.txEstimate(high, 65 * 1000, nativeUSD),
        label: 'Send Tokens'
      },
      {
        low: this.txEstimate(low, 200 * 1000, nativeUSD),
        high: this.txEstimate(high, 200 * 1000, nativeUSD),
        label: 'Dex Swap'
      }
    ]

    // const currentSymbol = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'symbol') || '?'

    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{'Fee Monitor'}</div>  
        <div className='gasBlock'>
          {this.state.baseHover ? <div className='feeToolTip feeToolTipBase cardShow'>The current base fee is added with a buffer to cover the next 3 blocks, any amount greater than your block's base fee is refunded</div> : null}
          {this.state.prioHover ? <div className='feeToolTip feeToolTipPriority cardShow'>A priority tip paid to validators is added to incentivize quick inclusion of your transaction into a block</div> : null }
          <div className='gasItem gasItemSmall' style={ !fees ? { pointerEvents: 'none', opacity: 0 } : {}}>
            <span className='gasGweiNum'>{actualBaseFee}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
            <span className='gasLevelLabel'>{'Current Base'}</span>
          </div>
          <div className='gasItem gasItemLarge'>
            <div 
              className='gasArrow' 
              onClick={() => this.setState({ baseHover: true })}
              style={ !fees ? { pointerEvents: 'none', opacity: 0 } : {}}
              onMouseLeave={() => this.setState({ baseHover: false })}
            >
              <div className='gasArrowNotify'>+</div>
              <div className='gasArrowInner'>{svg.chevron(27)}</div>
            </div>
            <span className='gasGweiNum'>{gasPrice}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
            <span className='gasLevelLabel'>{'Recommended'}</span>
            <div 
              className='gasArrow gasArrowRight'
              style={ !fees ? { pointerEvents: 'none', opacity: 0 } : {}}
              onClick={() => this.setState({ prioHover: true })}
              onMouseLeave={() => this.setState({ prioHover: false })}
            >
              <div className='gasArrowInner'>{svg.chevron(27)}</div>
            </div>
          </div>
          <div className='gasItem gasItemSmall' style={ !fees ? { pointerEvents: 'none', opacity: 0 } : {}}>
            <span className='gasGweiNum'>{priorityFee}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
            <span className='gasLevelLabel'>{'Priority Tip'}</span>
          </div>
        </div>
        <div className='gasEstimateBlock'>
          {feeEstimatesUSD.map((esimate) =>{
            return (
              <div className='gasEstimate'>
                <div className='gasEstimateRange'>
                  <span style={{ fontSize: '11px', marginRight: '-2px', marginTop: '-1px' }}>{!esimate.low || esimate.low >= 1 ? `$` : '<$'}</span>
                  <span className='gasEstimateRangeLow'>{`${!esimate.low ? 0 : esimate.low < 1 ? 1 : esimate.low}`}</span>
                </div>
                <div className='gasEstimateLabel'>{esimate.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Gas)