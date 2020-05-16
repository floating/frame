/* globals Worker */

import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'

import svg from '../../../svg'
import link from '../../../link'

import AddHardware from './AddHardware'
import AddAragon from './AddAragon'
import AddPhrase from './AddPhrase'
import AddRing from './AddRing'

const duration = { appear: 20, enter: 20, exit: 960 }

class Add extends React.Component {
  constructor (...args) {
    super(...args)
    this.particleWorker = new Worker('./particleWorker.js')
  }

  componentDidMount () {
    this.canvas = document.getElementById('canvas').transferControlToOffscreen()
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.particleWorker.postMessage({ type: 'init', canvas: this.canvas }, [this.canvas])
  }

  start () {
    this.particleWorker.postMessage({ type: 'start' })
  }

  toggleAddAccount (state) {
    if (state === 'entered' || state === 'exited') this.store.toggleAddAccount()
  }

  exit () {
    this.particleWorker.postMessage({ type: 'stop' })
  }

  render () {
    return (
      <Transition in={Boolean(this.store('view.addAccount') || this.store('view.addApp'))} timeout={duration} onEnter={() => this.start()} onExit={() => this.exit()}>
        {state => {
          return (
            <>
              {state !== 'exited' ? (
                <>
                  <div className={state === 'entered' ? 'addAccountShade addAccountShadeActive' : 'addAccountShade'} />
                  <div className={state === 'entered' ? 'addAccountMain addAccountMainActive' : 'addAccountMain'}>
                    <div className={this.store('view.addApp') ? 'addAccountMainInner' : 'addAccountMainInner addAccountMainInnerHide'}>
                      <div className='addAppsIntro'>
                        {'Install decentralized apps you use daily. Frame will resolve and keep them updated in a fully decentralized way. No one can in between you and access to your apps.'}
                      </div>
                      <AddDapp />
                      <div className='addAppsUpdates'>
                        <div className='addAppsUpdate addAppsUpdateGood'>
                          <div className='addAppsUpdateName'>
                            {'wallet.frame.eth'}
                          </div>
                          <div className='addAppsUpdateStatus'>
                            {'Installing'}
                          </div>
                          {/* <div className='addAppsUpdateTime'>
                            {'18hrs ago'}
                          </div> */}
                        </div>
                        <div className='addAppsUpdate addAppsUpdateBad'>
                          <div className='addAppsUpdateName'>
                            {'wallet.frame.eth'}
                          </div>
                          <div className='addAppsUpdateStatus'>
                            {'Installing'}
                          </div>
                          {/* <div className='addAppsUpdateTime'>
                            {'18hrs ago'}
                          </div> */}
                        </div>
                        <div className='addAppsUpdate'>
                          <div className='addAppsUpdateName'>
                            {'wallet.frame.eth'}
                          </div>
                          <div className='addAppsUpdateStatus'>
                            {'Installing'}
                          </div>
                          {/* <div className='addAppsUpdateTime'>
                            {'18hrs ago'}
                          </div> */}
                        </div>
                        <div className='addAppsUpdate addAppsUpdateGood'>
                          <div className='addAppsUpdateName'>
                            {'wallet.frame.eth'}
                          </div>
                          <div className='addAppsUpdateStatus'>
                            {'Installing'}
                          </div>
                          {/* <div className='addAppsUpdateTime'>
                            {'18hrs ago'}
                          </div> */}
                        </div>
                      </div>
                      <div className='addAppsFeatured'>
                        {'Featured Apps'}
                      </div>
                    </div>
                    <div className={this.store('view.addAccount') ? 'addAccountMainInner' : 'addAccountMainInner addAccountMainInnerHide'}>
                      <div className='addAccountSubtitle'>Add accounts to use with your decentralized apps</div>
                      <div className='addAccountBreak' />
                      <div className='addAccountHeader'><div style={{ marginRight: '10px' }}>{svg.octicon('server', { height: 17 })}</div><div>Hardware Accounts</div></div>
                      <AddHardware index={1} type='ledger' />
                      <AddHardware index={2} type='trezor' />
                      <div className='addAccountHeader'><div>{svg.lightbulb(20)}</div><div>Smart Accounts</div></div>
                      <AddAragon index={3} />
                      <div className='addAccountHeader'><div>{svg.flame(20)}</div><div>Hot Accounts</div></div>
                      <AddPhrase index={4} />
                      <AddRing index={5} />
                      <div className='addAccountBreak' style={{ margin: '40px 0px 0px 0px' }} />
                      <div className='addAccountFooter'>{svg.logo(32)}</div>
                    </div>
                  </div>
                </>
              ) : null}
              <div style={state === 'exited' ? { display: 'none' } : {}} className={state === 'entered' ? 'addAccountShadeForward addAccountShadeForwardActive' : 'addAccountShadeForward'}>
                <canvas id='canvas' />
              </div>
            </>
          )
        }}
      </Transition>
    )
  }
}

export default Restore.connect(Add)


class AddDapp extends React.Component {
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Name'
    this.state = {
      ensInput: this.addAppFill,
      expanded: false
    }
  }

  handleAddApp () {
    if (this.state.ensInput === '' || this.state.ensInput === this.addAppFill) return
    const domain = this.state.ensInput
    const options = {}
    this.setState({ pending: 'add', pendingMessage: 'Installing ' + domain, ensInput: this.addAppFill })
    const cb = (err) => {
      if (err) {
        console.log(err)
        this.setState({ pending: 'error', pendingMessage: err })
        setTimeout(() => {
          this.setState({ pending: '', pendingMessage: '' })
        }, 3000)
      } else {
        this.setState({ pending: '', pendingMessage: '' })
      }
    }
    link.rpc('addDapp', domain, options, cb)
    // if (this.dappInput) this.dappInput.blur()
    // this.setState({ ensInput: this.addAppFill })
  }

  handleOnFocus () {
    if (this.state.ensInput === this.addAppFill) this.setState({ ensInput: '' })
  }

  handleOnBlur () {
    if (this.state.ensInput === '') this.setState({ ensInput: this.addAppFill })
  }

  render () {
    return (
      <div className='addAppForm'>
        <div className='addAppInput'>
          <input
            ref={c => { this.dappInput = c }}
            value={this.state.ensInput}
            onFocus={::this.handleOnFocus}
            onBlur={::this.handleOnBlur}
            onChange={e => this.setState({ ensInput: e.target.value })}
            onKeyPress={e => { if (e.key === 'Enter') this.handleAddApp() }}
          />
        </div>
        <div className='addAppSubmit' onMouseDown={::this.handleAddApp}>
          <div className='addAppSubmitButton'>Install</div>
        </div>
      </div>
    )
  }

  renderOld () {
    let addDappClass = this.state.expanded ? 'dockCardAddDapp dockCardAddDappExpanded' : 'dockCardAddDapp'
    return (
      <>
        <div className='addAppButton' onMouseDown={() => {
          this.setState({ expanded: !this.state.expanded })
        }}>
          {'Add +'}
        </div>
        <div className={addDappClass}>
          <div className='addAppButton' onMouseDown={() => {
            this.setState({ expanded: !this.state.expanded })
          }}>
            {'Add +'}
          </div>
          {this.state.pending ? (
            <div className='addAppForm'>
              {this.state.pendingMessage}
            </div>
          ) : (
            this.dragging ? (
              <div className='addAppForm'>
                <div
                  className='removeApp'
                  onMouseEnter={e => this.removePending()}
                  onMouseLeave={e => this.cancelRemoval()}
                >
                  {this.state.pendingRemoval ? <div className='removeAppPending' /> : null}
                  {svg.trash(16)}
                </div>
              </div>
            ) : (
              <div className='addAppForm'>
                <div className='addAppInput'>
                  <input
                    ref={c => { this.dappInput = c }}
                    value={this.state.ensInput}
                    onFocus={::this.handleOnFocus}
                    onBlur={::this.handleOnBlur}
                    onChange={e => this.setState({ ensInput: e.target.value })}
                    onKeyPress={e => { if (e.key === 'Enter') this.handleAddApp() }}
                  />
                </div>
                <div
                  className='addAppSubmit'
                  onMouseDown={::this.handleAddApp}
                >
                  <div className='addAppSubmitButton'>+</div>
                </div>
              </div>
            )
          )}
        </div>
      </>
    )
  }
}
