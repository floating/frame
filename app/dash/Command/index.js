import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Command extends React.Component {
  renderSignerIcon(type) {
    if (type === 'ledger') {
      return <div className='expandedSignerIcon'>{svg.ledger(20)}</div>
    } else if (type === 'trezor') {
      return <div className='expandedSignerIcon'>{svg.trezor(20)}</div>
    } else if (type === 'seed' || type === 'ring') {
      return <div className='expandedSignerIcon'>{svg.flame(23)}</div>
    } else if (type === 'lattice') {
      return <div className='expandedSignerIcon'>{svg.lattice(22)}</div>
    } else {
      return <div className='expandedSignerIcon'>{svg.logo(20)}</div>
    }
  }
  renderSignerTitle() {
    const { data = {} } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
    const signer = data.signer ? this.store('main.signers', data.signer) : {}
    if (!signer) return null
    return (
      <div className='expandedSignerTitle'>
        {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
        {this.renderSignerIcon(signer.type)}
        <div className='signerName'>{signer.name}</div>
      </div>
    )
  }
  render() {
    const { view } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
    return (
      <div className='command'>
        {this.store('windows.dash.nav').length ? (
          <div
            className='commandItem commandItemBack cardShow'
            onClick={() => {
              link.send('tray:action', 'backDash')
            }}
          >
            {svg.chevronLeft(16)}
          </div>
        ) : null}
        <div key={view} className='commandTitle cardShow'>
          {view === 'expandedSigner' ? this.renderSignerTitle() : view}
        </div>
        <div
          className='commandItem commandItemClose'
          onClick={() => {
            link.send('tray:action', 'closeDash')
          }}
        >
          {svg.x(16)}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Command)
