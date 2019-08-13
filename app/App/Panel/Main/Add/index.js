import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'
import svg from '../../../../svg'
// import link from '../../../../link'

import AddHardware from './AddHardware'
import AddAragon from './AddAragon'
import AddPhrase from './AddPhrase'
import AddRing from './AddRing'

const duration = { appear: 20, enter: 20, exit: 960 }

// <div className='addAccountItem' style={{ transitionDelay: (0.64 * 1 / 4) + 's' }}>
//   <div className='addAccountItemBar addAccountItemHardware' />
//   <div className='addAccountItemWrap'>
//     <div className='addAccountItemTop'>
//       <div className='addAccountItemIcon addAccountItemIconHardware'>
//         <div className='addAccountItemIconType addAccountItemIconHardware'>{svg.trezor(17)}</div>
//         <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
//       </div>
//       <div className='addAccountItemTopTitle'>{'Trezor'}</div>
//       <div className='addAccountItemTopTitle'>{''}</div>
//     </div>
//     <div className='addAccountItemSummary'>{'Unlock your Trezor to get started'}</div>
//     <div className='addAccountItemDevices'>
//       {untethered.length || tethered.length ? (
//         untethered.map(id => {
//           let signer = this.store('main.signers', id)
//           if (signer.type === 'trezor') {
//             return (
//               <div className='addAccountItemDevice' style={{ height: '70px' }}>
//                 <div className='addAccountItemDeviceTitle'>{'Device Found'}</div>
//                 <div className='addAccountItemDeviceStatus'>{signer.status}</div>
//               </div>
//             )
//           } else {
//             return null
//           }
//         }).concat(tethered.map(id => {
//           let signer = this.store('main.signers', id)
//           if (signer.type === 'trezor') {
//             return (
//               <div className='addAccountItemDevice'>
//                 <div className='addAccountItemDeviceTitle'>{'Device Found'}</div>
//                 <div className='addAccountItemDeviceStatus'>{'Account Created'}</div>
//               </div>
//             )
//           } else {
//             return null
//           }
//         }))
//       ) : (
//         <div className='addAccountItemDevice'>
//           <div className='addAccountItemDeviceTitle'>
//             {'No Devices Found'}
//           </div>
//         </div>
//       )}
//     </div>
//     <div className='addAccountItemSummary'>{'Need a signer? Get a Trezor'}</div>
//   </div>
// </div>

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
    this.particleWorker = new Worker('./worker.js')
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

// <div className='addAccountItem' style={{ opacity: 0.3, transitionDelay: (0.64 * 4 / 4) + 's' }}>
//   <div className='addAccountItemBar addAccountItemHot' />
//   <div className='addAccountItemWrap'>
//     <div className='addAccountItemTop'>
//       <div className='addAccountItemIcon'>
//         <div className='addAccountItemIconType addAccountItemIconHot'>{svg.ring(21)}</div>
//         <div className='addAccountItemIconHex addAccountItemIconHexHot' />
//       </div>
//       <div className='addAccountItemTopTitle'>{'Keyring'}</div>
//       <div className='addAccountItemTopTitle'>{''}</div>
//     </div>
//     <div className='addAccountItemSummary'>{'A keyring account uses a list of private keys  to backup and restore your account '}</div>
//     <div className='addAccountItemOption'>
//       <div className='addAccountItemOptionIntro'>
//         {'Coming Soon'}
//       </div>
//     </div>
//     <div className='addAccountItemSummary'>{'Need a  private key? Generate one'}</div>
//   </div>
// </div>
