import React from 'react'
import Restore from 'react-restore'

import RingIcon from '../../../resources/Components/RingIcon'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

class _RequestItem extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      ago: this.getElapsedTime() + ' ago'
    }
  }
  getElapsedTime() {
    const elapsed = Date.now() - ((this.props.req && this.props.req.created) || 0)
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
  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({ ago: this.getElapsedTime() + ' ago' })
    }, 1000)
  }
  componentWillUnmount() {
    clearInterval(this.timer)
  }
  render() {
    const { account, handlerId, i, title, svgName, img, color, headerMode, txNonce, children } = this.props
    const req = this.store('main.accounts', account, 'requests', handlerId)

    let requestItemDetailsClass = 'requestItemDetails'
    let requestItemNoticeClass = 'requestItemNotice'

    if (['sent', 'sending', 'verifying', 'confirming', 'confirmed'].includes(req.status)) {
      requestItemDetailsClass += ' requestItemDetailsGood'
      requestItemNoticeClass += ' requestItemNoticeGood'
    } else if (['error', 'declined'].includes(req.status)) {
      requestItemDetailsClass += ' requestItemDetailsBad'
      requestItemNoticeClass += ' requestItemNoticeBad'
    }

    const status = (req.status || 'pending').toLowerCase()
    const notice = (req.notice || '').toLowerCase()

    const inactive = ['error', 'declined', 'confirmed'].includes(req.status)

    return (
      <div
        key={req.handlerId}
        className={headerMode ? 'requestItem requestItemHeader' : 'requestItem'}
        onClick={
          !headerMode
            ? () => {
                const crumb = {
                  view: 'requestView',
                  data: {
                    step: 'confirm',
                    accountId: account,
                    requestId: req.handlerId
                  },
                  position: {
                    bottom: req.type === 'transaction' ? '200px' : '140px'
                  }
                }
                link.send('nav:forward', 'panel', crumb)
              }
            : null
        }
      >
        <div
          className='requestItemBackground'
          style={{
            background: `linear-gradient(180deg, ${color} 0%, transparent 80%)`
          }}
        />
        <div className='requestItemTitle'>
          <div className='requestItemTitleLeft'>
            <div className='requestItemIcon'>
              <RingIcon color={color} svgName={svgName} img={img} small={true} />
            </div>
            <div className='requestItemMain'>
              <div className='requestItemTitleMain'>{title}</div>
            </div>
          </div>
          <div className='requestItemTitleTime'>
            <div className='requestItemTitleTimeItem'>{this.state.ago}</div>
          </div>
        </div>
        <div style={headerMode ? { pointerEvents: 'auto' } : { pointerEvents: 'none' }}>{children}</div>
        <div className={requestItemDetailsClass}>
          <div className='requestItemDetailsSlide'>
            <div
              className={
                inactive
                  ? 'requestItemDetailsIndicator requestItemDetailsIndicatorStill'
                  : 'requestItemDetailsIndicator'
              }
            >
              <div className='requestItemDetailsIndicatorMarker' />
            </div>
            <span>{status}</span>
            {/* <div className='requestItemDetailsIndicator' /> */}
          </div>
          {headerMode ? (
            <div className={inactive ? 'requestItemWave requestItemWaveDisabled' : 'requestItemWave'}>
              <div className='requestItemLine'>{svg.sine()}</div>
              <div className='requestItemLine requestItemLineShadow'>{svg.sine()}</div>
            </div>
          ) : (
            <div className='requestItemDetailsView'>
              <div className='requestItemDetailsViewText'>{`View`}</div>
              <div className='requestItemDetailsViewArrow'>
                <div>{svg.chevron(15)}</div>
                <div>{svg.chevron(15)}</div>
                <div>{svg.chevron(15)}</div>
              </div>
            </div>
          )}
        </div>
        {notice && notice !== status && <div className={requestItemNoticeClass}>{notice}</div>}
      </div>
    )
  }
}

export default Restore.connect(_RequestItem)
