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
  render () {
    const { type, id } = this.store('main.currentNetwork')
    const levels = this.store('main.networks', type, id, 'gas.price.levels') || {}
    return (
      <div ref={this.moduleRef} className='gasBlock'>
        <div className='gasItem'>
          <div className='gasGwei'>
            <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.slow, 16))}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
          </div>
          <div className='gasLevel'>
            {'Slow'}
          </div>
        </div>
        <div className='gasItem'>
          <div className='gasGwei'>
            <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.standard, 16))}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
          </div>
          <div className='gasLevel'>
            {'Medium'}
          </div>
        </div>
        <div className='gasItem'>
          <div className='gasGwei'>
            <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.fast, 16))}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
          </div>
          <div className='gasLevel'>
            {'Fast'}
          </div>
        </div>
        <div className='gasItem'>
         <div className='gasGwei'>
            <span className='gasGweiNum'>{utils.weiToGwei(parseInt(levels.asap, 16))}</span>
            <span className='gasGweiLabel'>{'GWEI'}</span>
          </div>
          <div className='gasLevel'>
            {'ASAP'}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Gas)