import styled from 'styled-components'
import React, { useState } from 'react'
import Restore from 'react-restore'
import link from '../../link'
import svg from '../../svg'

import { PanelMenu } from './styled'

import { Cluster, ClusterRow, ClusterValue } from '../../Components/Cluster'

import Glitch from '../../Components/Glitch'

const Button = ({ id, glitch, onClick, setGlitch, active, children }) => {
  return (
    <ClusterValue
      onClick={onClick}
      width={60}
      onMouseEnter={() => setGlitch(id)}
      onMouseOver={() => setGlitch(id)}
      onMouseLeave={() => setGlitch('')}
    >
      <div style={{ width: '60px', height: '32px' }}>
        <Glitch active={active} on={glitch}>
          {children}
        </Glitch>
      </div>
    </ClusterValue>
  )
}

import React, { useState } from 'react'

const glitch = (el, on) => {
  return (
    <div className={on ? 'glitch glitchOn' : 'glitch'}>
      {[...Array(10).keys()].map((i) => (
        <div key={i + 'hg'} className='line'>
          {el}
        </div>
      ))}
      {!on ? <div className='line lastLine'>{el}</div> : null}
    </div>
  )
}

const MenuButtonWrap = styled.div`
  position: relative;
  height: 48px;
  width: calc(100% / 5);
  cursor: pointer;
  * {
    pointer-events: none;
  }
`

const MenuButton = ({ space = 'command', svg, data = {}, views = [] }) => {
  const [glitchOnSidebar, setGlitchOnSidebar] = useState(false)
  return (
    <MenuButtonWrap
      onClick={() => {
        setGlitchOnSidebar(false)
        link.send('workspace:run', space, { station: 'command' }, views)
      }}
      onMouseEnter={() => setGlitchOnSidebar(true)}
      onMouseOver={() => setGlitchOnSidebar(true)}
      onMouseLeave={() => setGlitchOnSidebar(false)}
    >
      <div style={{ width: '60px', height: '100%' }}>{glitch(svg, glitchOnSidebar)}</div>
    </MenuButtonWrap>
  )
}

class Menu extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      glitchOnSend: false,
      glitchOnSidebar: false,
      glitchOnAccounts: false,
      glitchOn: ''
    }
  }
  glitch(el, on) {
    return (
      <div className={on ? 'glitch glitchOn' : 'glitch'}>
        {[...Array(10).keys()].map((i) => (
          <div key={i + 'hg'} className='line'>
            {el}
          </div>
        ))}
        {!on ? <div className='line lastLine'>{el}</div> : null}
      </div>
    )
  }
  renderSignerIcon(type) {
    if (type === 'ledger') {
      return <div className='expandedSignerIcon'>{svg.ledger(20)}</div>
    } else if (type === 'trezor') {
      return <div className='expandedSignerIcon'>{svg.trezor(20)}</div>
    } else if (type === 'seed' || type === 'ring') {
      return <div className='expandedSignerIcon'>{svg.flame(23)}</div>
    } else if (type === 'lattice') {
      return <div className='expandedSignerIcon'>{svg.lattice(22)}</div>
    } else {
      return <div className='expandedSignerIcon'>{svg.logo(20)}</div>
    }
  }
  renderSignerTitle() {
    const { data = {} } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
    const signer = data.signer ? this.store('main.signers', data.signer) : {}
    if (!signer) return null
    return (
      <div className='expandedSignerTitle'>
        {this.renderSignerIcon(signer.type)}
        <div className='signerName'>{signer.name}</div>
      </div>
    )
  }
  render() {
    if (this.props.window === 'dash') {
      const { view } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
      return (
        <PanelMenu>
          {this.store('windows.dash.nav').length ? (
            <Cluster>
              <ClusterRow>
                <Button
                  id={'backDash'}
                  glitch={this.state.glitchOn === 'backDash'}
                  setGlitch={(on) => {
                    this.setState({ glitchOn: on ? 'backDash' : '' })
                  }}
                  onClick={() => {
                    link.send('tray:action', 'backDash')
                  }}
                >
                  <div>{svg.chevronLeft(16)}</div>
                </Button>
              </ClusterRow>
            </Cluster>
          ) : null}
          <div key={view} className='commandTitle cardShow'>
            {view === 'expandedSigner' ? this.renderSignerTitle() : view}
          </div>
          <Cluster>
            <ClusterRow>
              <Button
                id={'closeDash'}
                glitch={this.state.glitchOn === 'closeDash'}
                setGlitch={(on) => {
                  this.setState({ glitchOn: on ? 'closeDash' : '' })
                }}
                onClick={() => {
                  link.send('tray:action', 'closeDash')
                }}
              >
                {svg.x(16)}
              </Button>
            </ClusterRow>
          </Cluster>
        </PanelMenu>
      )
    } else if (this.props.window === 'panel') {
      const crumb = this.store('windows.panel.nav')[0] || {}
      const accountManagerActive = crumb.view === 'accountManager'
      return (
        <PanelMenu>
          <MenuButton space='command' svg={svg.window(15)} />
          <MenuButton space='accounts' svg={svg.accounts(16)} />
          <MenuButton space='chains' svg={svg.chain(18)} />
          <MenuButton space='settings' svg={svg.settings(16)} />
          <MenuButton space='dapp' views={['send.frame.eth']} svg={svg.send(16)} />
        </PanelMenu>
      )
    }
  }
}

export default Restore.connect(Menu)
