import React from 'react'
import Restore from 'react-restore'

// import Native from '../../resources/Native'
// import link from '../../resources/link'

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
  renderPanel () {
    const { view, data } = this.store('windows.dash.nav')[0] || { view: 'default', data: {} }
    if (view === 'accounts') return <Accounts data={data} />
    if (view === 'expandedSigner' && data.signer) {
      const signer = this.store('main.signers', data.signer)
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
    return (
      <div className='dash'>
        <Command />
        <div className='dashMain'>
          <div className='dashMainOverlay' />
          <div className='dashMainScroll'>
            {this.renderPanel()}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dash)
