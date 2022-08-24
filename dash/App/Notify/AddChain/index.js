import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import ChainEditForm from '../ChainEditForm'

const labels = {
  title: 'Add New Chain',
  submit: 'Add Chain',
  submitted: 'Creating'
}

const defaults = {
  primaryRpc: 'Primary Endpoint',
  secondaryRpc: 'Secondary Endpoint'
}

function RPCInput ({ label, text, defaultText, updateText }) {
  const id = label.split(' ').map(s => s.toLowerCase()).join('-')

  return (
    <div className='chainExplorer chainInputField'>
      <label htmlFor={id} className='chainInputLabel'>{label}</label>
      <input
        id={id}
        className={text === defaultText ? 'chainInput chainInputDim' : 'chainInput'}
        value={text}
        spellCheck='false'
        onChange={(e) => {
          updateText(e.target.value)
        }}
        onFocus={(e) => {
          if (e.target.value === defaultText) updateText('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') updateText(defaultText)
        }}
      />
    </div>
  )
}

class AddChain extends React.Component {
  constructor (...args) {
    super(...args)

    const props = args[0]

    this.state = {
      primaryRpc: props.chain.primaryRpc || defaults.primaryRpc,
      secondaryRpc: props.chain.secondaryRpc || defaults.secondaryRpc
    }
  }

  chainIdExists (chainId) {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return existingChains.includes(parseInt(chainId))
  }

  onSubmit (submittedChain) {
    const chainToAdd = {
      ...submittedChain,
      primaryRpc: this.state.primaryRpc,
      secondaryRpc: this.state.secondaryRpc
    }

    link.send('tray:addChain', chainToAdd)
  }

  validateSubmit (enteredChain) {
    if (this.chainIdExists(enteredChain.id)) {
      return {
        message: 'Chain ID already exists',
        valid: false
      }
    }

    return {
      valid: true
    }
  }

  render () {
    return (
      <ChainEditForm
        chain={this.props.chain}
        labels={labels}
        onSubmit={this.onSubmit.bind(this)}
        validateSubmit={this.validateSubmit.bind(this)}
      >
        <RPCInput
          text={this.state.primaryRpc}
          defaultText={defaults.primaryRpc}
          label='Primary RPC'
          updateText={(text) => this.setState({ primaryRpc: text })} />
        
        <RPCInput
          text={this.state.secondaryRpc}
          defaultText={defaults.secondaryRpc}
          label='Secondary RPC'
          updateText={(text) => this.setState({ secondaryRpc: text })} />
      </ChainEditForm>
    )
  }
}

export default Restore.connect(AddChain)
