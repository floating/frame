import React from 'react'
import Restore from 'react-restore'

import RingIcon from '../../../resources/Components/RingIcon'
// import chainMeta from '../../../../../resources/chainMeta'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

class _RequestItem extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      ago: this.getElapsedTime() + ' ago'
    }
  }
  getElapsedTime () {
    const elapsed = Date.now() - (this.props.req && this.props.req.created || 0)
    const secs = elapsed / 1000
    const mins = secs / 60
    const hrs = mins / 60
    const days = hrs / 24
    if (days >= 1) return Math.round(days) + 'd'
    if (hrs >= 1) return Math.round(hrs) + 'h'
    if (mins >= 1) return Math.round(mins) + 'm'
    if (secs >= 1) return Math.round(secs) + 's'
    return '0s'
  }
  componentDidMount () {
    this.timer = setInterval(() => {
      this.setState({ ago: this.getElapsedTime() + ' ago' })
    }, 1000)
  }
  componentWillUnmount () {
    clearInterval(this.timer)
  }
  render () {
    const { account, handlerId, i, title, svgLookup, img, color, headerMode, txNonce } = this.props
    const req = this.store('main.accounts', account, 'requests', handlerId)
    return (
      <div 
        key={req.handlerId}
        className={headerMode ? 'requestItem requestItemHeader' : 'requestItem cardShow' }
        onClick={() => {
          const crumb = { 
            view: 'requestView',
            data: {
              step: 'confirm', 
              accountId: account, 
              requestId: req.handlerId
            }
          }
          link.send('nav:forward', 'panel', crumb)
        }}
      >
        <div className='requestItemDetails'>
          <div className='requestItemDetailsSlide'>
            <div className='requestItemDetailsIndicator' />
            {req.status || 'pending'}
          </div>
        </div>
        <div className='requestItemTitle'>
          <div className='requestItemIcon'>
            <RingIcon 
              color={color}
              svgLookup={svgLookup}
              img={img}
            />
          </div>
          <div className='requestItemMain'>
            <div className='requestItemTitleMain'>
              {title}
            </div>
            <div className='requestItemTitleSub'>
              <div 
                className='requestItemTitleSubIcon'
              >
                {svg.window(10)}
              </div>
              <div className='requestItemTitleSubText'>
                {this.store('main.origins', req.origin, 'name')}
              </div>
            </div>
          </div>
          {txNonce ? (
            <div 
              className='requestMetaNonce'
            >
              <div className='txNonceControl'>
                <div className='txNonceButton txNonceButtonLower' onMouseDown={() => link.send('tray:adjustNonce', req.handlerId, -1)}>
                  {svg.octicon('chevron-down', { height: 14 })}
                </div>
                <div className='txNonceButton txNonceButtonRaise' onMouseDown={() => link.send('tray:adjustNonce', req.handlerId, 1)}>
                  {svg.octicon('chevron-up', { height: 14 })}
                </div>
                
              </div>
              <div className='txNonceLabel'>Nonce</div>
              <div className={'txNonceNumber'}>
                {nonce}
              </div>
            </div>
          ) : (
            <div className='requestItemTitleTime'>
              <div className='requestItemTitleTimeItem'>
                {this.state.ago}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(_RequestItem)
