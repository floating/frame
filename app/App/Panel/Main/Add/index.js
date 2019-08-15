/* globals Worker */

import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'
import svg from '../../../../svg'

import AddHardware from './AddHardware'
import AddAragon from './AddAragon'
import AddPhrase from './AddPhrase'
import AddRing from './AddRing'

const duration = { appear: 20, enter: 20, exit: 960 }

class Add extends React.Component {
  constructor (...args) {
    super(...args)
    this.particles = false
  }

  setup () {
    if (this.particles) return
    this.particles = true
    const canvas = document.getElementById('canvas').transferControlToOffscreen()
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    this.particleWorker = new Worker('./particleWorker.js')
    this.particleWorker.postMessage({ type: 'init', canvas }, [ canvas ])
  }

  toggleAddAccount (state) {
    if (state === 'entered' || state === 'exited') this.store.toggleAddAccount()
  }

  exit () {
    this.particleWorker.terminate()
    this.particles = false
  }

  render () {
    return (
      <Transition in={Boolean(this.store('view.addAccount'))} timeout={duration} onExit={() => this.exit()}>
        {state => {
          if (state === 'entered') this.setup()
          return (
            <React.Fragment>
              {state !== 'exited' ? (
                <React.Fragment>
                  <div className={state === 'entered' ? 'addAccountShade addAccountShadeActive' : 'addAccountShade'} />
                  <div className={state === 'entered' ? 'addAccountMain addAccountMainActive' : 'addAccountMain'} >
                    <div className='addAccountMainInner'>
                      <div className='addAccountTitle'>{'Add Account'}</div>
                      <div className='addAccountBreak' />
                      <div className='addAccountSubtitle'>{'Add or create a decentralized account to use with any dapp'}</div>
                      <div className='addAccountBreak' />
                      <div className='addAccountHeader'><div style={{ marginRight: '10px' }}>{svg.octicon('server', { height: 17 })}</div><div>{'Hardware Accounts'}</div></div>
                      <AddHardware index={1} type={'ledger'} />
                      <AddHardware index={2} type={'trezor'} />
                      <div className='addAccountHeader'><div>{svg.lightbulb(20)}</div><div>{'Smart Accounts'}</div></div>
                      <AddAragon index={3} />
                      <div className='addAccountHeader'><div>{svg.flame(20)}</div><div>{'Hot Accounts'}</div></div>
                      <AddPhrase index={4} />
                      <AddRing index={5} />
                      <div className='addAccountBreak' style={{ margin: '40px 0px 0px 0px' }} />
                      <div className='addAccountFooter'>{svg.logo(32)}</div>
                    </div>
                  </div>
                </React.Fragment>
              ) : null}
              <div className={state !== 'exited' && state !== 'entering' ? 'addAccountInterface addAccountInterfaceActive' : 'addAccountInterface'}>
                <div className='panelBottomMenu'>
                  <div className={state === 'entered' ? 'addAccountTrigger addAccountTriggerActive' : 'addAccountTrigger'} onMouseDown={() => this.toggleAddAccount(state)}>
                    <div className='addAccountTriggerIcon'>{'+'}</div>
                  </div>
                </div>
              </div>
              {state !== 'exited' ? (
                <div className={state === 'entered' ? 'addAccountShadeForward addAccountShadeForwardActive' : 'addAccountShadeForward'}>
                  <canvas id='canvas' />
                </div>
              ) : null}
            </React.Fragment>
          )
        }}
      </Transition>
    )
  }
}

export default Restore.connect(Add)
