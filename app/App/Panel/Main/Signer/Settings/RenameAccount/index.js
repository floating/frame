import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../link'

class RenameAccount extends React.Component {
  constructor (props, context) {
    super(props, context)

    const { store } = context
    this.accountId = store('selected.current')
    this.accountName = store(`main.accounts.${this.accountId}.name`)
    this.state = { value: this.accountName }

    store.observer(() => {
      this.accountId = store('selected.current')
      this.accountName = store(`main.accounts.${this.accountId}.name`)
      this.setState({ value: this.accountName })
    })
  }

  handleChange = (e) => this.setState({ value: e.target.value })

  handleSubmit = () => {
    link.send('tray:renameAccount', this.accountId, this.state.value)
    this.props.onClose()
  }

  handleCancel = () => {
    setTimeout(() => { this.setState({ value: this.accountName }) }, 250)
    this.props.onClose()
  }

  render () {
    return (
      <div className='renameAccountWrap'>
        <input className='renameAccountInput' value={this.state.value} onChange={this.handleChange} />
        <div className='renameAccountButtonWrap'>
          <div className='renameAccountButton' onMouseDown={this.handleCancel}>Cancel</div>
          <div className='renameAccountButton' onMouseDown={this.handleSubmit}>Rename</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(RenameAccount)
