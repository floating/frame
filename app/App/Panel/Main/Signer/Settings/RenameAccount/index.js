import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../resources/link'

class RenameAccount extends React.Component {
  constructor (props, context) {
    super(props, context)
    const { store } = context
    this.accountId = store('selected.current')
    this.accountName = store(`main.accounts.${this.accountId}.name`)
    this.state = { value: this.accountName }
  }

  componentDidMount () {
    this.observer = this.store.observer(() => {
      this.accountId = this.store('selected.current')
      this.accountName = this.store(`main.accounts.${this.accountId}.name`)
    })
  }

  componentWillUnmount () {
    this.observer.remove()
  }

  handleChange (e) {
    this.setState({ value: e.target.value })
  }

  handleFocus (e) {
    if (e.target.value === this.accountName) this.setState({ value: '' })
  }

  handleBlur (e) {
    if (e.target.value === '') this.setState({ value: this.accountName })
  }

  handleSubmit () {
    link.send('tray:renameAccount', this.accountId, this.state.value)
    this.props.onClose()
  }

  handleCancel () {
    setTimeout(() => { this.setState({ value: this.accountName }) }, 250)
    this.props.onClose()
  }

  render () {
    return (
      <div className='renameAccountWrap'>
        <div className='signerSubsliderSlideMessage'>Rename Account</div>
        <input className='renameAccountInput' tabIndex='-1' value={this.state.value} onChange={this.handleChange.bind(this)} onFocus={this.handleFocus.bind(this)} onBlur={this.handleBlur.bind(this)} />
        <div className='renameAccountButtonWrap'>
          <div className='renameAccountButton' onMouseDown={this.handleCancel.bind(this)}>Cancel</div>
          <div className='renameAccountButton' onMouseDown={this.handleSubmit.bind(this)}>Rename</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(RenameAccount)
