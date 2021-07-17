import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'
import sushi from './logo.png'
import oneInch from './1inch.png'
import uniswap from './uniswap.png'

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
    this.e = { p: ['QXJyb3dVcA==', 'QXJyb3dVcA==', 'QXJyb3dEb3du', 'QXJyb3dEb3du', 'QXJyb3dMZWZ0', 'QXJyb3dSaWdodA==', 'QXJyb3dMZWZ0', 'QXJyb3dSaWdodA==', 'Yg==', 'YQ=='], i: 0 }
  }
  h (e) {
    if (this.e.p.indexOf(btoa(e.key)) < 0 || btoa(e.key) !== this.e.p[this.e.i]) {
      this.e.i = 0
    } else {
      e.preventDefault()
      this.e.i++
      if (this.e.p.length === this.e.i) {
        this.e.i = 0
        if (this.state.l === true) {
          this.setState({l: false})
        } else {
          this.setState({l: true})
        }
      }
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
    document.addEventListener('keydown', this.h.bind(this))
  }
  componentWillUnmount () {
    link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: 0 })
    document.removeEventListener('keydown', this.h.bind(this))
  }
  render () {
    return (
      <div ref={this.moduleRef} className='launcher'>
        {this.state.l ? (
          <div className='launcherTiles'>
            <div className='dappTile' onMouseDown={() => link.send('tray:launchDapp', 'uniswap.eth') }>
              <img src={uniswap} />
            </div>
            <div className='dappTile' onMouseDown={() => link.send('tray:launchDapp', '1inch.eth') }>
              <img src={oneInch} />
            </div>
            <div className='dappTile' onMouseDown={() => link.send('tray:launchDapp', 'sushi.frame.eth')}>
              <img src={sushi} />
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Launcher)