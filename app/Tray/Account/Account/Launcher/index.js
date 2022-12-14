import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import sushi from './logo.png'
import oneInch from './1inch.png'
import uniswap from './uniswap.png'

class Launcher extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
          height: this.moduleRef.current.clientHeight
        })
      }
    })
    this.state = {
      expand: false
    }
    this.e = {
      p: [
        'QXJyb3dVcA==',
        'QXJyb3dVcA==',
        'QXJyb3dEb3du',
        'QXJyb3dEb3du',
        'QXJyb3dMZWZ0',
        'QXJyb3dSaWdodA==',
        'QXJyb3dMZWZ0',
        'QXJyb3dSaWdodA==',
        'Yg==',
        'YQ=='
      ],
      i: 0
    }
  }
  h(e) {
    if (this.e.p.indexOf(btoa(e.key)) < 0 || btoa(e.key) !== this.e.p[this.e.i]) {
      this.e.i = 0
    } else {
      e.preventDefault()
      this.e.i++
      if (this.e.p.length === this.e.i) {
        this.e.i = 0
        if (this.state.l === true) {
          this.setState({ l: false })
        } else {
          this.setState({ l: true })
        }
      }
    }
  }
  componentDidMount() {
    this.resizeObserver.observe(this.moduleRef.current)
    document.addEventListener('keydown', this.h.bind(this))
  }
  componentWillUnmount() {
    link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: 0 })
    document.removeEventListener('keydown', this.h.bind(this))
  }
  glitch(el) {
    return (
      <div className={this.state.glitchOn ? 'glitch glitchOn' : 'glitch'}>
        {[...Array(10).keys()].map((i) => (
          <div key={i + 'hg'} className='line'>
            {el}
          </div>
        ))}
        {!this.state.glitchOn ? <div className='line lastLine'>{el}</div> : null}
      </div>
    )
  }
  render() {
    return (
      <div ref={this.moduleRef} className='launcher'>
        <div className='launcherTiles'>
          <div
            className='dappTile launchButton'
            onClick={() => {
              this.setState({ glitchOn: false })
              link.send('*:addFrame', 'dappLauncher')
            }}
            onMouseEnter={() => this.setState({ glitchOn: true })}
            onMouseOver={() => this.setState({ glitchOn: true })}
            onMouseLeave={() => this.setState({ glitchOn: false })}
          >
            {this.glitch(
              <div className='launchButtonInner'>
                <div className='dashboradIcon'>{svg.send(13)}</div>
                <div>{'Send'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Launcher)
