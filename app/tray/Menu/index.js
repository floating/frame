import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import { PanelMenu, PanelMenuGroup, PanelMenuItem } from './styled'

import { Cluster, ClusterRow, ClusterValue } from '../../../resources/Components/Cluster'

class Menu extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      glitchOnSend: false,
      glitchOnSidebar: false,
      glitchOnAccounts: false
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
  render() {
    const crumb = this.store('windows.panel.nav')[0] || {}
    const accountManagerActive = crumb.view === 'accountManager'
    return (
      <PanelMenu>
        <Cluster>
          <ClusterRow>
            <ClusterValue
              width={60}
              onClick={() => {
                this.setState({ glitchOnSidebar: false })
                link.send('tray:action', 'setDash', {
                  showing: !this.store('windows.dash.showing')
                })
              }}
              onMouseEnter={() => this.setState({ glitchOnSidebar: true })}
              onMouseOver={() => this.setState({ glitchOnSidebar: true })}
              onMouseLeave={() => this.setState({ glitchOnSidebar: false })}
            >
              <div style={{ width: '60px', height: '32px' }}>
                {this.glitch(svg.sidebar(15), this.state.glitchOnSidebar)}
              </div>
            </ClusterValue>
            <ClusterValue
              width={60}
              onClick={() => {
                clearTimeout(this.clickTimer)
                this.clickTimer = setTimeout(() => {
                  this.setState({ glitchOnSend: false })
                  link.send('*:addFrame', 'dappLauncher')
                  link.send('tray:action', 'setDash', { showing: false })
                }, 50)
              }}
              onMouseEnter={() => this.setState({ glitchOnSend: true })}
              onMouseOver={() => this.setState({ glitchOnSend: true })}
              onMouseLeave={() => this.setState({ glitchOnSend: false })}
            >
              <div style={{ width: '60px', height: '32px' }}>
                {this.glitch(svg.send(15), this.state.glitchOnSend)}
              </div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>
        <Cluster>
          <ClusterRow>
            <ClusterValue
              width={60}
              onClick={() => {
                clearTimeout(this.clickTimer)
                this.clickTimer = setTimeout(() => {
                  this.setState({ glitchOnSend: false })
                  if (accountManagerActive) {
                    link.send('nav:back', 'panel')
                  } else {
                    const crumb = {
                      view: 'accountManager',
                      data: {}
                    }
                    link.send('nav:forward', 'panel', crumb)
                  }
                }, 50)
              }}
              onMouseEnter={() => this.setState({ glitchOnAccounts: true })}
              onMouseOver={() => this.setState({ glitchOnAccounts: true })}
              onMouseLeave={() => this.setState({ glitchOnAccounts: false })}
            >
              <div style={{ width: '60px', height: '32px' }}>
                {this.glitch(svg.accounts(16), this.state.glitchOnAccounts)}
              </div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>
      </PanelMenu>
    )
  }
}

export default Restore.connect(Menu)
