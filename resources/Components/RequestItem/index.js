import React from 'react'

import RingIcon from '../../../resources/Components/RingIcon'

import { ClusterRow, ClusterValue } from '../../../resources/Components/Cluster'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

class _RequestItem extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      ago: this.getElapsedTime()
    }
  }
  getElapsedTime() {
    const elapsed = Date.now() - ((this.props.req && this.props.req.created) || 0)
    const secs = Math.floor(elapsed / 1000)
    const mins = Math.floor(secs / 60)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (days >= 1) return days + 'd ago'
    if (hrs >= 1) return hrs + 'h ago'
    if (mins >= 1) return mins + 'm ago'
    if (secs >= 30) return secs + 's ago'
    return 'NEW'
  }
  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({ ago: this.getElapsedTime() })
    }, 1000)
  }
  componentWillUnmount() {
    clearInterval(this.timer)
  }
  render() {
    const { account, title, svgName, img, color, headerMode, req, children } = this.props

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
      <ClusterRow>
        <ClusterValue
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
          <div key={req.handlerId} className={headerMode ? 'requestItem requestItemHeader' : 'requestItem'}>
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
                    <span role='status'>{status}</span>
                  </div>
                </div>
              </div>
              <div className='requestItemTitleTime'>
                {this.state.ago === 'NEW' ? (
                  <div className='requestItemTitleTimeItem' style={{ color: 'var(--good)' }}>
                    {this.state.ago}
                  </div>
                ) : (
                  <div className='requestItemTitleTimeItem'>{this.state.ago}</div>
                )}
              </div>
              <div className={requestItemDetailsClass}>
                <div className={inactive ? 'requestItemWave requestItemWaveDisabled' : 'requestItemWave'}>
                  <div className='requestItemLine'>{svg.sine()}</div>
                  <div className='requestItemLine requestItemLineShadow'>{svg.sine()}</div>
                </div>
              </div>
            </div>
            <div style={headerMode ? { pointerEvents: 'auto' } : { pointerEvents: 'none' }}>{children}</div>
            {notice && notice !== status && (
              <div
                role='alert'
                className={requestItemNoticeClass}
                style={notice === 'see signer' ? { color: 'var(--good)' } : {}}
              >
                {notice}
              </div>
            )}
          </div>
        </ClusterValue>
      </ClusterRow>
    )
  }
}

export default _RequestItem
