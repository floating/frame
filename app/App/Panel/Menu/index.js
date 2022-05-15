import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
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
  glitch (el) {
    return (
      <div className={this.state.glitchOn ? 'glitch glitchOn' : 'glitch'}>
        {[...Array(10).keys()].map(i => <div key={i + 'hg'} className='line'>{el}</div>)}
        {!this.state.glitchOn ? <div className='line lastLine'>{el}</div> : null }
      </div>
    )
  }
  render () {
    return (
      <div ref={this.moduleRef} className='panelMenu'>
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
            {this.glitch(<div className='launchButtonInner'>
              <div className='dashboradIcon'>
                {svg.send(13)}
              </div>
              <div>
                {'Send'}
              </div>
            </div>)}
          </div>
        {/* <div className='mainWindowMarker'>
          {this.store('dash.showing') ? (
            <div className='panelMenuMark panelMenuMarkGood' style={{ transform: `translateX(8px)` }} />
          ) : null}
        </div> */}
        {/* <div className='panelMenuMarker'>
          <div className='panelMenuMark' style={{ transform: `translateX(${markLeft}px)` }} />
        </div> */}
        <div 
          className={'panelMenuItem panelMenuItemOpen'}
          onMouseDown={() => link.send('tray:action', 'setDash', 'default')}
        >
          {svg.window(15)}
        </div>

        <div 
          className={'panelMenuItem panelMenuItemSend'}
          onMouseDown={() => link.send('tray:action', 'setDash', 'default')}
        >
          {svg.send(15)}
        </div>
        {/* <div key={this.store('panel.view')} className='panelTitle'>
          {this.store('panel.view') === 'default' ? (
            'Accounts' 
          ) : this.store('panel.view') === 'networks' ? (
            'Chains'
          ) : this.store('panel.view') === 'settings' ? (
            'Settings'
          ) : null}
        </div> */}
        {/* <div className='panelMenuItemNetwork'>
          <Dropdown
            syncValue={type + ':' + id}
            onChange={(network) => this.selectNetwork(network)}
            options={networkOptions}
          />
        </div> */}
                    {/* <div className='panelDetailIndicator'>
            {this.indicator(this.store('main.networks', type, id, 'connection'))}
          </div> */}
        {/* <div className='panelMenuItem panelMenuItemAccounts' onMouseDown={() => this.store.setPanelView('default')}>
          {svg.accounts(15)}

        </div>
        <div className='panelMenuItem panelMenuItemConnections' onMouseDown={() => this.store.setPanelView('networks')}>
          {svg.chain(16)}
        </div> */}
        {/* <div className='panelMenuItem panelMenuItemSettings' onMouseDown={() => this.store.setPanelView('settings')}>
          {svg.settings(15)}
        </div> */}
        {/* {type === 'ethereum' ? (
          <div className='panelMenuData' style={{ opacity: this.store('view.addAccount') ? 0 : 1 }}>
            <div className='panelMenuDataItem'>
              {gasPrice || '---'}
              <div className='svg'>{svg.gas(9)}</div>
            </div>
            <div className='panelMenuDataDivide' />
            <div className='panelMenuDataItem'>
              <div className='usd'>{svg.usd(10.5)}</div>
              <div>{baseRate}</div>
            </div>
          </div>
        ) : null} */}
      </div>
    )
  }
}

export default Restore.connect(Launcher)