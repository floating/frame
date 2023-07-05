// import React from 'react'
// import Restore from 'react-restore'
// import link from '../../../resources/link'
// import svg from '../../../resources/svg'

// import styled from 'styled-components'

// import { Cluster, ClusterRow, ClusterColumn, ClusterValue } from '../../../resources/Components/Cluster'

// export const PanelMenu = styled.div`
//   position: absolute;
//   left: 8px;
//   right: 8px;
//   top: 12px;
//   /* height: 63px; */
//   box-sizing: border-box;
//   display: flex;
//   justify-content: space-between;
//   -webkit-app-region: no-drag;
//   z-index: 1000000000;
//   opacity: 1;
//   transform: translate3d(0, 0, 0);
// `

// class Command extends React.Component {
//   renderSignerIcon(type) {
//     if (type === 'ledger') {
//       return <div className='expandedSignerIcon'>{svg.ledger(20)}</div>
//     } else if (type === 'trezor') {
//       return <div className='expandedSignerIcon'>{svg.trezor(20)}</div>
//     } else if (type === 'seed' || type === 'ring') {
//       return <div className='expandedSignerIcon'>{svg.flame(23)}</div>
//     } else if (type === 'lattice') {
//       return <div className='expandedSignerIcon'>{svg.lattice(22)}</div>
//     } else {
//       return <div className='expandedSignerIcon'>{svg.logo(20)}</div>
//     }
//   }
//   renderSignerTitle() {
//     const { data = {} } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
//     const signer = data.signer ? this.store('main.signers', data.signer) : {}
//     if (!signer) return null
//     return (
//       <div className='expandedSignerTitle'>
//         {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
//         {this.renderSignerIcon(signer.type)}
//         <div className='signerName'>{signer.name}</div>
//       </div>
//     )
//   }
//   render() {
//     const { view } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
//     return (
//       <PanelMenu>
//         {this.store('windows.dash.nav').length ? (
//           <Cluster>
//             <ClusterRow>
//               <ClusterValue
//                 width={60}
//                 onClick={() => {
//                   link.send('tray:action', 'backDash')
//                 }}
//               >
//                 <div style={{ width: '60px', height: '32px' }}>{svg.chevronLeft(16)}</div>
//               </ClusterValue>
//             </ClusterRow>
//           </Cluster>
//         ) : null}
//         <div key={view} className='commandTitle cardShow'>
//           {view === 'expandedSigner' ? this.renderSignerTitle() : view}
//         </div>
//         <Cluster>
//           <ClusterRow>
//             <ClusterValue
//               width={60}
//               onClick={() => {
//                 link.send('tray:action', 'closeDash')
//               }}
//             >
//               <div style={{ width: '60px', height: '32px' }}> {svg.x(16)}</div>
//             </ClusterValue>
//           </ClusterRow>
//         </Cluster>
//       </PanelMenu>
//     )
//   }
// }

// export default Restore.connect(Command)

import React from 'react'
import Restore from 'react-restore'
import link from '../../link'
import svg from '../../svg'

import { PanelMenu, PanelMenuGroup, PanelMenuItem } from './styled'

import { Cluster, ClusterRow, ClusterValue } from '../../Components/Cluster'

import Glitch from '../../Components/Glitch'

// const Glitch = ({ children, on, active }) => {
//   return (
//     <div className={on ? 'glitch glitchOn' : 'glitch'}>
//       {[...Array(10).keys()].map((i) => (
//         <div key={i + 'hg'} className='line'>
//           {children}
//         </div>
//       ))}
//       {!on ? <div className='line lastLine'>{children}</div> : null}
//     </div>
//   )
// }

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
        {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
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
              {/* <ClusterValue
                width={60}
                onClick={() => {
                  clearTimeout(this.clickTimer)
                  this.clickTimer = setTimeout(() => {
                    this.setState({ glitchOnSend: false })
                  }, 50)
                  if (accountManagerActive) {
                    link.send('nav:back', 'panel')
                  } else {
                    const crumb = {
                      view: 'accountManager',
                      data: {}
                    }
                    link.send('nav:forward', 'panel', crumb)
                  }
                }}
                onMouseEnter={() => this.setState({ glitchOnAccounts: true })}
                onMouseOver={() => this.setState({ glitchOnAccounts: true })}
                onMouseLeave={() => this.setState({ glitchOnAccounts: false })}
              >
                <div style={{ width: '60px', height: '32px' }}>
                  {this.glitch(svg.accounts(16), this.state.glitchOnAccounts)}
                </div>
              </ClusterValue> */}
              <Button
                id={'accounts'}
                active={accountManagerActive}
                glitch={this.state.glitchOn === 'accounts'}
                setGlitch={(on) => {
                  this.setState({ glitchOn: on ? 'accounts' : '' })
                }}
                onClick={() => {
                  clearTimeout(this.clickTimer)
                  this.clickTimer = setTimeout(() => {
                    this.setState({ glitchOnSend: false })
                  }, 50)
                  if (accountManagerActive) {
                    link.send('nav:back', 'panel')
                  } else {
                    const crumb = {
                      view: 'accountManager',
                      data: {}
                    }
                    link.send('nav:forward', 'panel', crumb)
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {accountManagerActive && svg.chevronLeft(10)}
                  {svg.accounts(16)}
                </div>
              </Button>
            </ClusterRow>
          </Cluster>
        </PanelMenu>
      )
    }
  }
}

export default Restore.connect(Menu)
