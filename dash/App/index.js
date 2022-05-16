import React from 'react'
import Restore from 'react-restore'

// import Native from '../../resources/Native'
import link from '../../resources/link'

import Command from './Command'

import Main from './Main'
import Accounts from './Accounts'

import Chains from './Chains'

import Notify from './Panel/Notify'

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
    const selected = this.store('dash.panel')
    console.log('selected', selected)
    if (selected === 'accounts') return <Accounts />
    if (selected === 'chains') return <Chains />
    if (selected === 'dapps') return <Dapps />
    if (selected === 'tokens') return <Tokens />
    if (selected === 'settings') return <Settings />
    return <Main />
  }
  render () {
    return (
      <div className='dash'>
        <Command />
        <Notify />
        <div className='dashMain'>
          <div className='dashMainOverlay' />
          {this.renderPanel()}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dash)
