import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../link'

class RenameAccount extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.accountId = context.store('selected.current')
    this.accountName = context.store(`main.accounts.${this.accountId}.name`)
    this.state = { value: this.accountName }
  }

  handleChange = (e) => this.setState({ value: e.target.value })

  handleSubmit = () => {
    link.send('tray:renameAccount', this.accountId, this.state.value)
  }

  render () {
    return (
      <div className='renameAccountWrap'>
        <input className='renameAccountInput' value={this.state.value} onChange={this.handleChange} />
        <div className='renameAccountButtonWrap'>
          <div className='renameAccountButton'>Cancel</div>
          <div className='renameAccountButton' onMouseDown={this.handleSubmit}>Rename</div>
        </div>
      </div>
    )
  }

}

export default Restore.connect(RenameAccount)
