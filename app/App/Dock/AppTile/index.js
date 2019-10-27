/* globals fetch */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

const icons = {}

const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
const fallbackColor = dapp => {
  const hex = hashCode(dapp.domain).toString(16).replace('-', '')
  const r = Math.round(((220 - 210) * (parseInt(hex[0] + hex[1], 16) / 255)) + 210)
  const g = Math.round(((220 - 210) * (parseInt(hex[2] + hex[3], 16) / 255)) + 210)
  const b = Math.round(((240 - 230) * (parseInt(hex[4] + hex[5], 16) / 255)) + 230)
  return `rgb(${r}, ${g}, ${b})`
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
          console.log(e)
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

  render () {
    const { index, hash, dragging, docked, moving } = this.props
    if (moving) {
      return (
        <div key={index} className='addedApp'>
          <div className='addedAppCard'>
            {icons[this.cid] ? (
              <img src={icons[this.cid]} />
            ) : (
              <div className='appCardIconPlaceholder' style={{ background: fallbackColor(dragging.dapp) }}>
                {dragging.dapp.domain[0].toUpperCase() + dragging.dapp.domain[1] + dragging.dapp.domain[2]}
              </div>
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
              <div className='appCardIconPlaceholder' style={{ background: fallbackColor(dapp) }}>
                {dapp.domain[0].toUpperCase() + dapp.domain[1] + dapp.domain[2]}
              </div>
            )}
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(AppTile)
