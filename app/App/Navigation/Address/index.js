import React from 'react'
import Restore from 'react-restore'

class Address extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {url: ''}
  }
  componentDidMount = () => {
    this.store.observer(_ => {
      this.current = this.store('view.current')
      this.data = this.store('view.data', this.current)
      this.setState({url: this.data.url})
      if (this.data.url === '') this.input.select()
    })
  }
  onChange = (e) => {
    this.setState({url: e.target.value})
  }
  onKeyPress = e => {
    if (e.key === 'Enter') {
      this.input.blur()
      let url = this.input.value
      if (url.slice(0, 8).toLowerCase() === 'frame://') {
        this.input.value = url
        // Frame Specific Behavior
        this.store.events.emit('loadURL', url)
      } else {
        if (url.slice(0, 8).toLowerCase() !== 'https://' && url.slice(0, 7).toLowerCase() !== 'http://') url = 'http://' + url
        this.input.value = url
        this.store.events.emit('loadURL', url)
      }
    }
  }
  onFocus = () => this.input.select()
  onLink = () => this.store.events.emit('forceProvider')
  render () {
    let access = {status: 'default', visible: true}
    let sign = {status: 'default', visible: false}
    let push = 30 * ((sign.visible ? 1 : 0) + (access.visible ? 1 : 0))
    return (
      <div id='add'>
        <input id='address'
          ref={i => { this.input = i }}
          onKeyPress={this.onKeyPress}
          onFocus={this.onFocus}
          value={this.state.url}
          onChange={this.onChange}
          style={{width: 'calc(100% - ' + push + 'px)'}}
        />
      </div>
    )
  }
}

export default Restore.connect(Address)
