import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import octicons from 'octicons'

import Main from './Main'
import Local from './Local'

// <div className='panelMenuItem'>{svg.logo(19)}</div>

class Panel extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {scroll: 0}
  }
  indicator (status) {
    if (status === 'connected') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    } else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }
  status (connection) {
    let status = connection.status
    if (status === 'connected' && connection.network !== this.store('local.connection.network')) status = 'network mismatch'
    let current = connection.settings[this.store('local.connection.network')].current
    if (current === 'custom') {
      let target = connection.settings[this.store('local.connection.network')].options[current]
      if (this.state.customInput !== '' && this.state.customInput !== 'Custom' && target !== '' && !this.okProtocol(target)) status = 'invalid target'
    }
    return (
      <div className='connectionOptionStatus'>
        {this.indicator(status)}
        <div className='connectionOptionStatusText'>{status}</div>
      </div>
    )
  }
  render () {
    let open = this.store('tray.open')
    return (
      <div id='panel' onScroll={e => this.setState({scroll: ReactDOM.findDOMNode(e.target).scrollTop})} style={{transform: open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'}}>
        <div className='panelMenu' style={{opacity: this.store('signer.current') || (this.state.scroll < 50) ? 1 : 0}}>
          <div className='connectionOptionDetails'>
            <div className='connectionOptionDetailsInset'>
              {this.status(this.store('local.connection.local'))}
            </div>
          </div>
          <div className='panelMenuItem' onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['kebab-horizontal'].toSVG({height: 21})}} />
        </div>
        <Local />
        <Main />
      </div>
    )
  }
}

export default Restore.connect(Panel)
