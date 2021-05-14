import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

class Launcher extends React.Component {
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
    return (
      <div ref={this.moduleRef} className='launcher'>
        <div className='launcherTiles'>
          <div className='dappTile' onMouseDown={() => link.send('tray:launchDapp', 'matt.eth') }>
            {svg.ruby(24)}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Launcher)