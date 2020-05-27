/* globals fetch */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../../link'

const icons = {}

const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
const fallbackColor = (dapp, a) => {
  const hex = hashCode(dapp.domain).toString(16).replace('-', '')
  const r = Math.round(((150 - 90) * (parseInt(hex[0] + hex[1], 16) / 255)) + 90)
  const g = Math.round(((130 - 70) * (parseInt(hex[2] + hex[3], 16) / 255)) + 70)
  const b = Math.round(((200 - 140) * (parseInt(hex[4] + hex[5], 16) / 255)) + 140)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

class AppTile extends React.Component {
  constructor (props, context) {
    super(props, context)
    const dapp = props.hash ? context.store(`main.dapp.details.${props.hash}`) : ''
    this.cid = props.moving ? props.cid : dapp.cid
    setTimeout(() => {
      this.setState({ settled: true })
    })
  }

  onMouseDown (e) {
    const { index, hash, mouseDown } = this.props
    const dapp = this.store(`main.dapp.details.${hash}`)
    e.persist()
    this.enableDragTimeout = setTimeout(() => mouseDown(e, dapp, index), 200)
  }

  onMouseUp (e) {
    const { hash, dragging } = this.props
    const dapp = this.store(`main.dapp.details.${hash}`)
    clearTimeout(this.enableDragTimeout)
    if (!dragging) {
      link.rpc('launchDapp', dapp.domain, (err) => {
        err ? console.error(err) : console.log('Dapp launched')
      })
    }
  }

  onMouseEnter (e) {
    const { index, docked, moveDrag, dragging } = this.props
    if (dragging) moveDrag(index, docked)
  }

  appCardIconPlacholder (dapp) {
    return (
      <div className='appCardIconPlaceholder' style={{ color: fallbackColor(dapp, 1), background: fallbackColor(dapp, 0.2) }}>
        <div>
          <span>{dapp.domain[0].toUpperCase()}</span>
          <span>{dapp.domain[1]}</span>
        </div>
      </div>
    )
  }

  appTileLoader () {
    return (
      <div className='appTileLoader'>
        <div>
          <div className='miniloader' />
        </div>
      </div>
    )
  }
  
  componentDidMount () {
    this.store.observer(() => {
      const dapp = this.props.hash ? this.store(`main.dapp.details.${this.props.hash}`) : ''
      if (this.cid && !icons[this.cid] && dapp && dapp.icon) {
        let ext = dapp.icon.name.substr(dapp.icon.name.lastIndexOf('.') + 1)
        icons[this.cid] = `data:image/${ext};base64, ${dapp.icon.content}`
        this.forceUpdate()
      }
    })
  }

  render () {
    const { index, hash, dragging, docked, moving } = this.props
    if (moving) {
      return (
        <div key={index} className='addedApp'>
          <div className='addedAppCard'>
            {icons[this.cid] ? (
              <img src={icons[this.cid]} />
            ) : (
              this.appCardIconPlacholder(dragging.dapp)
            )}
          </div>
        </div>
      )
    } else {
      const dapp = this.store(`main.dapp.details.${hash}`)
      const tileClass = docked ? 'dockedApp' : 'addedApp'
      const cardClass = docked ? 'dockedAppCard' : 'addedAppCard'
      const beingDragged = dragging && dragging.dapp && dragging.docked === docked && dragging.index === index
      const style = !beingDragged ? {} : !docked ? { opacity: 0.6, transform: 'scale(1.2)', boxShadow: 'none' } : { opacity: 0.6 }
      const handleMouseDown = beingDragged ? () => {} : this.onMouseDown.bind(this)
      const handleMouseUp = beingDragged ? () => {} : this.onMouseUp.bind(this)
      const handleMouseEnter = beingDragged ? () => {} : this.onMouseEnter.bind(this)
      const on = this.store(`main.openDapps`).indexOf(dapp.domain) > -1
      return (
        <div key={index} className={tileClass} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseEnter={handleMouseEnter}>
          <div className={cardClass} style={style}>
            <div className={on ? 'appTileIndicator' : 'appTileIndicator appTileIndicatorOff'} />
            {!dapp.pinned ? this.appTileLoader() : null}
            <div className='appTileIconWrap' style={dapp.pinned ? { opacity: 1, transform: 'scale(1)' } : { opacity: 0.3, transform: 'scale(0.6)' }}>
              {icons[this.cid] ? (
                <img src={icons[this.cid]} />
              ) : (
                this.appCardIconPlacholder(dapp)
              )}
            </div>
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(AppTile)
