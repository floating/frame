/* globals fetch */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

const icons = {}

const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
const fallbackColor = (dapp, a) => {
  const hex = hashCode(dapp.domain).toString(16).replace('-', '')
  const r = Math.round(((150 - 90) * (parseInt(hex[0] + hex[1], 16) / 255)) + 90)
  const g = Math.round(((150 - 90) * (parseInt(hex[2] + hex[3], 16) / 255)) + 90)
  const b = Math.round(((200 - 140) * (parseInt(hex[4] + hex[5], 16) / 255)) + 140)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

class AppTile extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.cid = props.moving ? props.cid : context.store(`main.dapps.${props.hash}.hash`)
    if (this.cid && !icons[this.cid]) {
      fetch(`http://localhost:8080/ipfs/${this.cid}/favicon.ico`)
        .then(res => {
          if (res.status === 200) return res
          throw new Error(res.statusText)
        })
        .then(response => response.blob())
        .then(images => {
          icons[this.cid] = URL.createObjectURL(images)
          this.forceUpdate()
        })
        .catch(e => {
          delete icons[this.cid]
        })
    }
  }

  onMouseDown (e) {
    const { index, hash, mouseDown } = this.props
    const dapp = this.store(`main.dapps.${hash}`)
    e.persist()
    this.enableDragTimeout = setTimeout(() => mouseDown(e, dapp, index), 200)
  }

  onMouseUp (e) {
    const { hash, dragging } = this.props
    const dapp = this.store(`main.dapps.${hash}`)
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
      const dapp = this.store(`main.dapps.${hash}`)
      const tileClass = docked ? 'dockedApp' : 'addedApp'
      const cardClass = docked ? 'dockedAppCard' : 'addedAppCard'
      const beingDragged = dragging && dragging.dapp && dragging.docked === docked && dragging.index === index
      const style = !beingDragged ? {} : !docked ? { opacity: 0.3, boxShadow: 'none', transform: 'scale(1.4)' } : { opacity: 0.3 }
      const handleMouseDown = beingDragged ? () => {} : this.onMouseDown.bind(this)
      const handleMouseUp = beingDragged ? () => {} : this.onMouseUp.bind(this)
      const handleMouseEnter = beingDragged ? () => {} : this.onMouseEnter.bind(this)
      return (
        <div key={index} className={tileClass} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseEnter={handleMouseEnter}>
          <div className={cardClass} style={style}>
            {icons[this.cid] ? (
              <img src={icons[this.cid]} />
            ) : (
              this.appCardIconPlacholder(dapp)
            )}
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(AppTile)
