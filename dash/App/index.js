import React from 'react'
import Restore from 'react-restore'

import Native from '../../resources/Native'
import Local from './Panel/Local'
import Accounts from './Accounts'

import Chains from './Panel/Networks'

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
    if ( selected === 'accounts') {
      return <Accounts />
    } else if ( selected === 'chains') {
      return <Chains />
    } else {
      return <Local />
    }
  }
  render () {
    return (
      <div className='dash'>
        {this.renderPanel()}
      </div>
    )
  }
}

export default Restore.connect(Dash)
