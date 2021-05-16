import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import utils from '../../../../../../resources/utils'

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
  render () {
    const { type, id } = this.store('main.currentNetwork')
    const levels = this.store('main.networks', type, id, 'gas.price.levels') || {}
    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{'Gas Prices'}</div>  
        <div className='gasBlock'>
          <div className='gasItem'>
            <div className='gasGwei'>
              <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.slow, 16))}</span>
              <span className='gasGweiLabel'>{'GWEI'}</span>
            </div>
            <div className='gasLevel'>
              <div>{'Slow'}</div>
              <div className='gasLevelTime'>{this.renderFeeTime(levels.slowTime)}</div>
            </div>
          </div>
          <div className='gasItem'>
            <div className='gasGwei'>
              <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.standard, 16))}</span>
              <span className='gasGweiLabel'>{'GWEI'}</span>
            </div>
            <div className='gasLevel'>
              <div>{'Medium'}</div>
              <div className='gasLevelTime'>{this.renderFeeTime(levels.standardTime)}</div>
            </div>
          </div>
          <div className='gasItem'>
            <div className='gasGwei'>
              <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.fast, 16))}</span>
              <span className='gasGweiLabel'>{'GWEI'}</span>
            </div>
            <div className='gasLevel'>
              <div>{'Fast'}</div>
              <div className='gasLevelTime'>{this.renderFeeTime(levels.fastTime)}</div>
            </div>
          </div>
          <div className='gasItem'>
          <div className='gasGwei'>
              <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.asap, 16))}</span>
              <span className='gasGweiLabel'>{'GWEI'}</span>
            </div>
            <div className='gasLevel'>
              <div>{'ASAP'}</div>
              <div className='gasLevelTime'>{this.renderFeeTime(levels.asapTime)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Gas)