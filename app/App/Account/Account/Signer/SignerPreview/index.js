import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

function isHardwareSigner (account = {}) {
  return ['ledger', 'lattice', 'trezor'].includes(account.lastSignerType)
}

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
        }
      })
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  renderSignerType (type) {
    if (type === 'lattice') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.lattice(22)}</div>
          <div>{'GridPlus Lattice1'}</div>
        </div>
      )
    } else if (type === 'ledger') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.ledger(19)}</div>
          <div>{'Ledger Device'}</div>
        </div>
      )
    } else if (type === 'trezor') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.trezor(17)}</div>
          <div>{'Trezor Device'}</div>
        </div>
      )
    } else if (type === 'aragon') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.aragon(30)}</div>
          <div>{'Agent Actor'}</div>
        </div>
      )
    } else if (type === 'seed') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.seedling(23)}</div>
          <div>{'Seed Signer'}</div>
        </div>
      )
    } else if (type === 'keyring') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.key(20)}</div>
          <div>{'Keyring Signer'}</div>
        </div>
      )
    } else {
      return (
        <div className='moduleItemSignerType'>
          <div>{'No Signer, watch-only'}</div>
        </div>
      )
    }
  }

  render () {
    const activeAccount =  this.store('main.accounts', this.props.account)

    let signer

    if (activeAccount.signer) {
      signer = this.store('main.signers', activeAccount.signer)
    } else if (activeAccount .smart)  {
      const actingSigner = this.store('main.accounts', activeAccount.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }

    const hardwareSigner = isHardwareSigner(activeAccount)
    const status = (signer && signer.status) || (hardwareSigner ? 'Disconnected' : 'No Signer')

    return (
      <div 
        className='balancesBlock'
        ref={this.moduleRef}
      >
        <div className='moduleHeader'>
          <span style={{ position: 'relative', top: '2px' }}>{svg.sign(19)}</span>
          <span>{'Signer'}</span>
        </div>
        <div className='moduleMainPermissions'>
          <div className='moduleItem'>
            {this.renderSignerType(activeAccount.lastSignerType)}
            <div className=''>{status}</div>
          </div>
          {!hardwareSigner ? (
            <div className='moduleItem'>{status === 'locked' ? 'Unlock' : 'Lock'}</div>
          ) : null}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)

