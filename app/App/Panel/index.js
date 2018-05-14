import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import octicons from 'octicons'

import Main from './Main'
import Local from './Local'

// <div className='panelMenuItem'>{svg.logo(19)}</div>
// <Restore.DevTools />

class Panel extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {scroll: 0}
  }
  render () {
    let open = this.store('tray.open')
    return (
      <div id='panel' onScroll={e => this.setState({scroll: ReactDOM.findDOMNode(e.target).scrollTop})} style={{transform: open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'}}>
        <div className='panelMenu' style={{opacity: this.store('signer.current') || (this.state.scroll < 50) ? 1 : 0}}>
          <div className='panelMenuItem' onClick={() => this.store.toggleSettings()} dangerouslySetInnerHTML={{__html: octicons['three-bars'].toSVG({height: 20})}} />
        </div>
        <Local />
        <Main />
      </div>
    )
  }
}

export default Restore.connect(Panel)
