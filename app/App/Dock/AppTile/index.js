import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
const fallbackColor = dapp => {
  const hex = hashCode(dapp.domain).toString(16).replace('-', '')
  const r = Math.round(((220 - 210) * (parseInt(hex[0] + hex[1], 16) / 255)) + 210)
  const g = Math.round(((220 - 210) * (parseInt(hex[2] + hex[3], 16) / 255)) + 210)
  const b = Math.round(((240 - 230) * (parseInt(hex[4] + hex[5], 16) / 255)) + 230)
  return `rgb(${r}, ${g}, ${b})`
}

class AppTile extends React.Component {
  render () {
    const { index, hash, dragging, docked, mouseDown, moveDrag } = this.props
    const dapp = this.store(`main.dapps.${hash}`)
    const tileClass = docked ? 'dockedApp' : 'addedApp'
    const cardClass = docked ? 'dockedAppCard' : 'addedAppCard'
    if (dragging && dragging.dapp && dragging.docked === docked && dragging.index === index) {
      const style = !docked ? { opacity: 0.3, boxShadow: 'none', transform: 'scale(1.4)' } : { opacity: 0.3 }
      return (
        <div key={index} className={tileClass}>
          <div className={cardClass} style={style}>
            <div className='appCardIconPlaceholder' style={{ background: fallbackColor(dapp) }}>
              {dapp.domain[0].toUpperCase() + dapp.domain[1]}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div
          key={index}
          className={tileClass}
          onMouseDown={e => {
            e.persist()
            this.enableDragTimeout = setTimeout(() => mouseDown(e, dapp, index), 200)
          }}
          onMouseUp={e => {
            clearTimeout(this.enableDragTimeout)
            if (!dragging) {
              link.rpc('launchDapp', dapp.domain, (err) => {
                err ? console.error(err) : console.log('Dapp launched')
              })
            }
          }}
          onMouseEnter={e => { if (dragging) moveDrag(index, docked) }}
        >
          <div className='addedAppCard'>
            <div className='appCardIconPlaceholder' style={{ background: fallbackColor(dapp) }}>
              {dapp.domain[0].toUpperCase() + dapp.domain[1]}
            </div>
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(AppTile)
