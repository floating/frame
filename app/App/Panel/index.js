import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import octicons from 'octicons'

import Main from './Main'
import Local from './Local'

const networks = {1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan'}

class Panel extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {scroll: 0}
  }
  indicator (connection) {
    let status = [connection.local.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }
  render () {
    let open = this.store('tray.open')
    return (
      <div id='panel' onScroll={e => this.setState({scroll: ReactDOM.findDOMNode(e.target).scrollTop})} style={{transform: open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'}}>
        <div className='panelMenu' style={{opacity: this.store('signer.current') || (this.state.scroll < 50) ? 1 : 0}}>
          <div className='panelDetail'>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('local.connection'))}
            </div>
            <div className='panelDetailText'>{networks[this.store('local.connection.network')]}</div>
          </div>
          <div className='panelMenuItem' style={this.store('panel.view') !== 'default' ? {transform: 'rotate(180deg)'} : {}} onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['kebab-horizontal'].toSVG({height: 21})}} />
        </div>
        <Local />
        <Main />
      </div>
    )
  }
}

export default Restore.connect(Panel)
