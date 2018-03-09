import React from 'react'
import octicons from 'octicons'

import Address from './Address'

class Navigation extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      access: {status: 'default', visible: true},
      sign: {status: 'default', visible: false}
    }
  }
  componentDidMount = () => {
    this.webview = document.getElementById('webview')
  }
  render () {
    return (
      <div id='bot'>
        <div id='nav'>
          <div id='back' onClick={() => this.webview.goBack()} dangerouslySetInnerHTML={{__html: octicons['chevron-left'].toSVG({height: 18})}} />
          <div id='forward' onClick={() => this.webview.goForward()} dangerouslySetInnerHTML={{__html: octicons['chevron-right'].toSVG({height: 18})}} />
        </div>
        <Address />
        <div id='permissions'>
          {this.state.access.visible ? <div className='permission permissionLink' dangerouslySetInnerHTML={{__html: octicons['link'].toSVG({height: 17})}} onClick={this.onLink} /> : null}
          {this.state.sign.visible ? <div className='permission permissionSign' dangerouslySetInnerHTML={{__html: octicons['pencil'].toSVG({height: 15})}} /> : null}
        </div>
      </div>
    )
  }
}

export default Navigation
