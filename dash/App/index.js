import React from 'react'
import Restore from 'react-restore'

// import Native from '../../resources/Native'
import svg from '../../resources/svg'
import link from '../../resources/link'

import Command from './Command'

import Main from './Main'
import Accounts from './Accounts'
import Signer from './Signer'

import Chains from './Chains'

import Notify from './Notify'

import Dapps from './Dapps'
import Tokens from './Tokens'
import Settings from './Settings'


class Dash extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.input = React.createRef()
    this.state = {
      showAddAccounts: false,
      selected: 'home'
    }
  }
  renderFooter () {
    const { view, data } = this.store('windows.dash.nav')[0] || { view: 'default', data: {} }
    if (view === 'accounts') {
      return (
        <div className='dashFooter'>
          <div className='dashFooterButton' onClick={() => link.send('tray:action', 'navDash', { view: 'accounts', data: { showAddAccounts: true } })}>
            <div className='newAccountIcon'>{svg.plus(16)}</div> 
            Add New Account
          </div>
        </div>
      )
    } else if (view === 'chains') {

      return (
        <div className='dashFooter'>
          <div className='dashFooterButton' onClick={() => link.send('tray:action', 'navDash', {
            view: 'chains',
            data: {
              newChain: {}
            }})
          }>
            <div className='newAccountIcon'>{svg.plus(16)}</div> 
            Add New Chain
          </div>
        </div>
      )
    } else if (view === 'tokens') {
      return (
        <div className='dashFooter'>
          <div className='dashFooterButton' onClick={() => link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken', notifyData: this.props.req }})}>
            <div className='newAccountIcon'>{svg.plus(16)}</div> 
            Add New Token
          </div>
        </div>
      )
    } else {
      return null
    }
  }
  renderPanel () {
    const { view, data } = this.store('windows.dash.nav')[0] || { view: 'default', data: {} }
    if (view === 'accounts') return <Accounts data={data} />
    if (view === 'expandedSigner' && data.signer) {
      const signer = this.store('main.signers', data.signer)
      if (!signer) return null
      return <Signer expanded={true} key={signer.id + ':expanded'} {...signer} />
    }
    if (view === 'chains') return <Chains data={data} />
    if (view === 'dapps') return <Dapps data={data} />
    if (view === 'tokens') return <Tokens data={data} />
    if (view === 'settings') return <Settings data={data} />
    if (view === 'notify') return <Notify data={data} />
    return <Main />
  }
  render () {
    const { bottom } = this.store('windows.dash.nav')[0] || {}
    return (
      <div className='dash'>
        <Command />
        <div className='dashMain'
          style={{ bottom: bottom || '40px' }}
        >
          <div className='dashMainOverlay' />
          <div className='dashMainScroll'>
            {this.renderPanel()}
          </div>
        </div>
        {this.renderFooter()}
      </div>
    )
  }
}

export default Restore.connect(Dash)
