import React from 'react'
import Restore from 'react-restore'
import { Transition } from 'react-transition-group'
import svg from '../../../../svg'
import link from '../../../../link'

const duration = { appear: 20, enter: 20, exit: 960 }

class _AddAragon extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      dao: '0x0000000000000000000000000000000000000000',
      agent: '0x0000000000000000000000000000000000000000',
      index: 0
    }
  }
  onChange (key, e) {
    e.preventDefault()
    let update = {}
    update[key] = (e.target.value || '').replace(/\W/g, '')
    this.setState(update)
  }
  onBlur (key, e) {
    e.preventDefault()
    let update = {}
    update[key] = this.state[key] || '0x0000000000000000000000000000000000000000'
    this.setState(update)
  }
  onFocus (key, e) {
    e.preventDefault()
    if (this.state[key] === '0x0000000000000000000000000000000000000000') {
      let update = {}
      update[key] = ''
      this.setState(update)
    }
  }
  next () {
    this.setState({ index: ++this.state.index })
  }
  actorAccount (actorId) {
    this.setState({ actorId })
    this.next()
  }
  actorAddress (actorAddress, actorIndex) {
    let aragonAccount = {
      id: this.state.dao,
      index: 0,
      addresses: [this.state.agent], // Agent Address
      type: 'Aragon',
      smart: {
        type: 'aragon',
        actor: { // Reference to Frame account that will act on behalf of the agent
          id: this.state.actorId,
          index: actorIndex,
          address: actorAddress // External Signer
        },
        dao: this.state.dao, // DAO Address
        agent: this.state.agent // Agent Address
      }
    }
    console.log(' ')
    console.log(' ')
    console.log('Make Aragon Account')
    console.log(aragonAccount)
    console.log(' ')
    console.log(' ')
    link.rpc('addAragon', aragonAccount, () => {
      console.log('addAragon cb called')
    })
    this.store.toggleAddAccount()
  }
  render () {
    let itemClass = 'addAccountItem addAccountItemSmart'
    if (this.state.adding) itemClass += ' addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index) + 's' }}>
        <div className='addAccountItemBar addAccountItemSmart' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconSmart'>{svg.octicon('light-bulb', { height: 22 })}</div>
              <div className='addAccountItemIconHex addAccountItemIconHexSmart' />
            </div>
            <div className='addAccountItemTopTitle'>{'Aragon'}</div>
            <div className='addAccountItemTopTitle'>{''}</div>
          </div>
          <div className='addAccountItemSummary'>{'An Aragon smart account allows you to use your Aragon DAO with any dapp'}</div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => { this.setState({ adding: true }) }}>
              {'Add Aragon Account'}
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Enter dao address'}</div>
                  <div className='addAccountItemOptionInput'>
                    <textarea maxLength='42' value={this.state.dao} onChange={e => this.onChange('dao', e)} onFocus={e => this.onFocus('dao', e)} onBlur={e => this.onBlur('dao', e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Enter dao\'s agent address'}</div>
                  <div className='addAccountItemOptionInput'>
                    <textarea maxLength='42' value={this.state.agent} onChange={e => this.onChange('agent', e)} onFocus={e => this.onFocus('agent', e)} onBlur={e => this.onBlur('agent', e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Choose acting account'}</div>
                  <div className='addAccountItemOptionList'>
                    {Object.keys(this.store('main.accounts')).map(id => {
                      let account = this.store('main.accounts', id)
                      return <div key={id} className='addAccountItemOptionListItem' onMouseDown={e => this.actorAccount(id)}>{account.type + ' Account'}</div>
                    })}
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Choose acting address'}</div>
                  <div className='addAccountItemOptionList'>
                    {(this.store('main.accounts', this.state.actorId, 'addresses') || []).map((a, i) => {
                      return (
                        <div key={a + i} className='addAccountItemOptionListItem fira' onMouseDown={e => this.actorAddress(a, i)}>
                          {a ? a.substring(0, 11) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 11) : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='addAccountItemSummary'>{'Don\'t have a dao? Create one'}</div>
        </div>
      </div>
    )
  }
}

const AddAragon = Restore.connect(_AddAragon)

class Add extends React.Component {
  constructor (...args) {
    super(...args)
    this.particles = false
  }
  setup () {
    if (this.particles) return
    this.particles = true
    let canvas = document.getElementById('canvas')
    if (canvas) {
      let ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        let particles = []
        let particleCount = 64
        class Particle {
          constructor () {
            this.x = canvas.width * Math.random()
            this.y = canvas.height * Math.random()
            this.vx = (Math.random() / 2) - 0.25
            this.vy = (Math.random() / 2) - 0.25
          }
          update () {
            this.x += this.vx
            this.y += this.vy
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy
            ctx.fillStyle = 'rgba(0, 210, 180, 0.85)'
            ctx.fillRect(this.x, this.y, 2, 2)
          }
        }
        for (let i = 0; i < particleCount; i++) particles.push(new Particle())
        let loop = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          for (let i = 0; i < particleCount; i++) particles[i].update(ctx)
          this.animate = window.requestAnimationFrame(loop)
        }
        loop()
      }
    }
  }
  toggleAddAccount (state) {
    if (state === 'entered' || state === 'exited') this.store.toggleAddAccount()
  }
  exit () {
    window.cancelAnimationFrame(this.animate)
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
                      <div className='addAccountHeader'>{svg.octicon('server', { height: 17 })}{'Hardware Accounts'}</div>
                      <div className='addAccountItem' style={{ transitionDelay: (0.64 * 0) + 's' }}>
                        <div className='addAccountItemBar addAccountItemHardware' />
                        <div className='addAccountItemWrap'>
                          <div className='addAccountItemTop'>
                            <div className='addAccountItemIcon'>
                              <div className='addAccountItemIconType addAccountItemIconHardware'>{svg.octicon('ellipsis', { height: 22 })}</div>
                              <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
                            </div>
                            <div className='addAccountItemTopTitle'>{'Ledger'}</div>
                            <div className='addAccountItemTopTitle'>{''}</div>
                          </div>
                          <div className='addAccountItemSummary'>{'Unlock your Ledger to get started'}</div>
                          <div className='addAccountItemOption'>
                            <div className='addAccountItemOptionIntro'>
                              {'No Device Found'}
                            </div>
                          </div>
                          <div className='addAccountItemSummary'>{'Need a signer? Get a Ledger'}</div>
                        </div>
                      </div>
                      <div className='addAccountItem' style={{ transitionDelay: (0.64 * 1) + 's' }}>
                        <div className='addAccountItemBar addAccountItemHardware' />
                        <div className='addAccountItemWrap'>
                          <div className='addAccountItemTop'>
                            <div className='addAccountItemIcon addAccountItemIconHardware'>
                              <div className='addAccountItemIconType addAccountItemIconHardware'>{svg.octicon('ellipsis', { height: 22 })}</div>
                              <div className='addAccountItemIconHex addAccountItemIconHexHardware' />
                            </div>
                            <div className='addAccountItemTopTitle'>{'Trezor'}</div>
                            <div className='addAccountItemTopTitle'>{''}</div>
                          </div>
                          <div className='addAccountItemSummary'>{'Unlock your Trezor to get started'}</div>
                          <div className='addAccountItemOption'>
                            <div className='addAccountItemOptionIntro'>
                              {'No Device Found'}
                            </div>
                          </div>
                          <div className='addAccountItemSummary'>{'Need a signer? Get a Trezor'}</div>
                        </div>
                      </div>
                      <div className='addAccountHeader'>{svg.octicon('flame', { height: 19 })}{'Hot Accounts'}</div>
                      <div className='addAccountItem' style={{ transitionDelay: (0.64 * 2) + 's' }}>
                        <div className='addAccountItemBar addAccountItemHot' />
                        <div className='addAccountItemWrap'>
                          <div className='addAccountItemTop'>
                            <div className='addAccountItemIcon'>
                              <div className='addAccountItemIconType addAccountItemIconHot'>{svg.octicon('flame', { height: 22 })}</div>
                              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
                            </div>
                            <div className='addAccountItemTopTitle'>{'Phrase'}</div>
                            <div className='addAccountItemTopTitle'>{''}</div>
                          </div>
                          <div className='addAccountItemColorBar addAccountItemHot' />
                          <div className='addAccountItemSummary'>{'A phrase account uses a list of 12 or 24 words to backup and restore your account'}</div>
                          <div className='addAccountItemOption'>
                            <div className='addAccountItemOptionIntro'>
                              {'No Device Found'}
                            </div>
                          </div>
                          <div className='addAccountItemSummary'>{'Need a seed phrase? Generate one'}</div>
                        </div>
                      </div>
                      <div className='addAccountItem' style={{ transitionDelay: (0.64 * 3) + 's' }}>
                        <div className='addAccountItemBar addAccountItemHot' />
                        <div className='addAccountItemWrap'>
                          <div className='addAccountItemTop'>
                            <div className='addAccountItemIcon'>
                              <div className='addAccountItemIconType addAccountItemIconHot'>{svg.octicon('flame', { height: 22 })}</div>
                              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
                            </div>
                            <div className='addAccountItemTopTitle'>{'Keyring'}</div>
                            <div className='addAccountItemTopTitle'>{''}</div>
                          </div>
                          <div className='addAccountItemColorBar addAccountItemHot' />
                          <div className='addAccountItemSummary'>{'A keyring account uses a list of private keys  to backup and restore your account '}</div>
                          <div className='addAccountItemOption'>
                            <div className='addAccountItemOptionIntro'>
                              {'Add Keyring Account'}
                            </div>
                          </div>
                          <div className='addAccountItemSummary'>{'Need a  private key? Generate one'}</div>
                        </div>
                      </div>
                      <div className='addAccountHeader'>{svg.octicon('light-bulb', { height: 19 })}{'Smart Accounts'}</div>
                      <AddAragon index={4} />
                      <div className='addAccountBreak' style={{ margin: '40px 0px 0px 0px' }} />
                      <div className='addAccountFooter'>
                        {'more account types soon'}
                      </div>
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
