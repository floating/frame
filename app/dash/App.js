import React from 'react'
import Restore from 'react-restore'

import Command from './Command'
import Main from './Main'
import Accounts from './Accounts'
import Signer from './Signer'
import Chains from './Chains'
import Notify from './Notify'
import Dapps from './Dapps'
import Tokens from './Tokens'
import Settings from './Settings'
import svg from '../../resources/svg'
import link from '../../resources/link'
import { capitalize } from '../../resources/utils'

function itemName(view) {
  return capitalize(view.slice(0, -1))
}

const AddNewItemButton = ({ view, req }) => {
  const dataMap = {
    accounts: { showAddAccounts: true },
    chains: { newChain: {} },
    tokens: { notify: 'addToken', notifyData: req }
  }
  return (
    <div className='dashFooter'>
      <div
        className='dashFooterButton'
        onClick={() => link.send('tray:action', 'navDash', { view, data: dataMap[view] })}
      >
        <div className='newAccountIcon'>{svg.plus(16)}</div>
        Add New {itemName(view)}
      </div>
    </div>
  )
}

class Dash extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.input = React.createRef()
    this.state = {
      showAddAccounts: false,
      selected: 'home'
    }
  }

  renderPanel(view, data) {
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

  render() {
    const { view, data } = this.store('windows.dash.nav')[0] || { view: 'default', data: {} }
    const showAddButton =
      ['chains', 'accounts', 'tokens'].includes(view) && (!data || Object.keys(data).length === 0)

    return (
      <div className='dash'>
        <Command />
        <div className='dashMain' style={{ bottom: showAddButton ? '120px' : '40px' }}>
          <div className='dashMainOverlay' />
          <div className='dashMainScroll'>{this.renderPanel(view, data)}</div>
        </div>
        {showAddButton && <AddNewItemButton view={view} req={this.props.req} />}
      </div>
    )
  }
}

export default Restore.connect(Dash)
