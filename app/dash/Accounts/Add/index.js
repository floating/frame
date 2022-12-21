/* globals Worker */

import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'
import svg from '../../../../resources/svg'

import AddHardware from './AddHardware'
import AddHardwareLattice from './AddHardwareLattice'
import AddPhrase from './AddPhrase'
import AddRing from './AddRing'
import AddAddress from './AddAddress'

const duration = { appear: 20, enter: 20, exit: 960 }

class Add extends React.Component {
  constructor(...args) {
    super(...args)
    this.particleWorker = new Worker('./particleWorker.js')
  }

  componentDidMount() {
    this.canvas = document.getElementById('canvas').transferControlToOffscreen()
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.particleWorker.postMessage({ type: 'init', canvas: this.canvas }, [this.canvas])
  }

  start() {
    this.particleWorker.postMessage({ type: 'start' })
  }

  toggleAddAccount(state) {
    if (state === 'entered' || state === 'exited') this.props.close()
  }

  exit() {
    this.particleWorker.postMessage({ type: 'stop' })
  }

  render() {
    return (
      <Transition
        in={Boolean(this.store('view.addAccount'))}
        timeout={duration}
        onEnter={() => this.start()}
        onExit={() => this.exit()}
      >
        {(state) => {
          return (
            <>
              {state !== 'exited' ? (
                <>
                  <div
                    className={
                      state === 'entered' ? 'addAccountShade addAccountShadeActive' : 'addAccountShade'
                    }
                  />
                  <div
                    className={state === 'entered' ? 'addAccountMain addAccountMainActive' : 'addAccountMain'}
                  >
                    <div className='addAccountMainInner'>
                      <div className='addAccountTitle'>Add Account</div>
                      <div className='addAccountBreak' />
                      <div className='addAccountSubtitle'>
                        Add or create a decentralized account to use with any dapp
                      </div>
                      <div className='addAccountBreak' />
                      <div className='addAccountHeader'>
                        <div style={{ marginRight: '10px' }}>{svg.octicon('server', { height: 17 })}</div>
                        <div>Hardware Accounts</div>
                      </div>
                      <AddHardware index={1} type='ledger' />
                      <AddHardware index={2} type='trezor' />
                      <AddHardwareLattice index={3} type='lattice' />
                      <div className='addAccountHeader'>
                        <div style={{ margin: '-1px 10px 0px 0px' }}>{svg.flame(18)}</div>
                        <div>Hot Accounts</div>
                      </div>
                      <AddPhrase index={4} />
                      <AddRing index={5} />
                      <div className='addAccountHeader'>
                        <div style={{ margin: '-3px 10px 0px 0px' }}>{svg.handshake(23)}</div>
                        <div>Nonsigning Accounts</div>
                      </div>
                      <AddAddress index={6} />
                      <div className='addAccountBreak' style={{ margin: '40px 0px 0px 0px' }} />
                      <div className='addAccountFooter'>{svg.logo(32)}</div>
                    </div>
                  </div>
                </>
              ) : null}
              <div
                className={
                  state !== 'exited' && state !== 'entering'
                    ? 'addAccountInterface addAccountInterfaceActive'
                    : 'addAccountInterface'
                }
              >
                <div className='panelBottomMenu'>
                  <div
                    className={
                      state === 'entered' ? 'addAccountTrigger addAccountTriggerActive' : 'addAccountTrigger'
                    }
                    onMouseDown={() => this.toggleAddAccount(state)}
                  >
                    <div className='addAccountTriggerIcon'>+</div>
                  </div>
                </div>
              </div>
              <div
                style={state === 'exited' ? { display: 'none' } : {}}
                className={
                  state === 'entered'
                    ? 'addAccountShadeForward addAccountShadeForwardActive'
                    : 'addAccountShadeForward'
                }
              >
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
