import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'
import PendingSigner from './PendingSigner'
import Add from './Add'

import svg from '../../../svg'

const accountNames = {
  1: 'Mainnet',
  3: 'Ropsten',
  4: 'Rinkeby',
  42: 'Kovan'
}

let firstScroll = true

class Main extends React.Component {
  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll () {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  accountSort (accounts, a, b) {
    a = accounts[a].created
    b = accounts[b].created
    if (a === -1 && b !== -1) return -1
    if (a !== -1 && b === -1) return 1
    if (a > b) return -1
    if (a < b) return 1
    return 0
  }

  render () {
    const accounts = {}
    const network = this.store('main.connection.network')
    Object.keys(this.store('main.accounts')).forEach(id => {
      const account = this.store('main.accounts', id)
      if (account.network === network) accounts[id] = account
    })
    const signers = {}
    Object.keys(this.store('main.signers')).forEach(id => {
      const signer = this.store('main.signers', id)
      if (signer.network === network) signers[id] = signer
    })
    const untethered = Object.keys(signers).filter(id => Object.keys(accounts).indexOf(id) < 0)
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    return (
      <div className={this.store('panel.view') !== 'default' ? 'main mainHidden' : 'main'}>
        <Add />
        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {untethered.sort().map((id, i) => <PendingSigner key={'signers' + id} {...this.store('main.signers', id)} index={i} />)}
              {Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b)).map((id, i) => <Signer key={id} {...accounts[id]} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />)}
              {Object.keys(accounts).length === 0 && Object.keys(signers).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {`No ${accountNames[network]} Accounts Found`}
                  <span className='getStarted' onMouseDown={() => this.store.notify('intro')}>{'Need help getting started?'}</span>
                  <span className='featureBox'>
                    <span className='featureBoxText'>
                      {`FRAME ALPHA`}
                    </span>
                    <span className='featureBoxSubtext'>
                      {'v' + require('../../../../package.json').version}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
