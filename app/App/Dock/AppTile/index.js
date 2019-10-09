import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

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
            {dapp.domain[0].toUpperCase() + dapp.domain[1]}
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
          onMouseEnter={e => {
            if (dragging) moveDrag(index, docked)
          }}
        >
          <div className='addedAppCard'>
            {dapp.domain[0].toUpperCase() + dapp.domain[1]}
          </div>
        </div>
      )
    }
  }
}

export default Restore.connect(AppTile)
