/* globals Worker */

import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'
import svg from '../../../svg'

import Networks from './Networks'

// import AddHardware from './AddHardware'
// import AddAragon from './AddAragon'
// import AddPhrase from './AddPhrase'
// import AddRing from './AddRing'

const duration = { appear: 20, enter: 20, exit: 960 }

class Add extends React.Component {
  constructor (...args) {
    super(...args)
    this.particleWorker = new Worker('./particleWorker.js')
  }

  componentDidMount () {
    this.canvas = document.getElementById('phaseCanvas').transferControlToOffscreen()
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
      <div className='phase' style={{ pointerEvents: this.store('view.addNetwork') ? 'auto' : 'none' }}>
        <Transition in={Boolean(this.store('view.addNetwork'))} timeout={duration} onEnter={() => this.start()} onExit={() => this.exit()}>
          {state => {
            return (
              <>
                {state !== 'exited' ? (
                  <>
                    <div className={state === 'entered' ? 'phaseShade phaseShadeActive' : 'phaseShade'} />
                    <div className={state === 'entered' ? 'phaseMain phaseMainActive' : 'phaseMain'}>
                      <Networks />
                    </div>
                    <div
                      className={state === 'entered' ? 'phaseClose phaseCloseActive' : 'phaseClose'} onMouseDown={() => {
                        this.store.toggleAddNetwork()
                      }}
                    >
                      {svg.octicon('x', { height: 18 })}
                    </div>
                  </>
                ) : null}
                <div style={state === 'exited' ? { display: 'none' } : {}} className={state === 'entered' ? 'phaseShadeForward phaseShadeForwardActive' : 'phaseShadeForward'}>
                  <canvas id='phaseCanvas' />
                </div>
              </>
            )
          }}
        </Transition>
      </div>
    )
  }
}

export default Restore.connect(Add)

/* <div className='phaseHeader'><div style={{ marginRight: '10px' }}>{svg.octicon('server', { height: 17 })}</div><div>Hardware Accounts</div></div>
<AddHardware index={1} type='ledger' />
<AddHardware index={2} type='trezor' />
<div className='phaseHeader'><div>{svg.lightbulb(20)}</div><div>Smart Accounts</div></div>
<AddAragon index={3} />
<div className='phaseHeader'><div>{svg.flame(20)}</div><div>Hot Accounts</div></div>
<AddPhrase index={4} />
<AddRing index={5} /> */
