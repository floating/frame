import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'
import { isHardwareSigner } from '../../../../../../resources/utils/signers'

const isWatchOnly = (account = {}) => {
  return ['address'].includes(account.lastSignerType.toLowerCase())
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
    this.state = {
      notifySuccess: false,
      notifyText: ''
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  verifyAddress (hardwareSigner) {
    if (hardwareSigner) {
      // prompt for on-signer verification
      this.setState({ notifySuccess: false, notifyText: 'Verify address on signer' })
    }
    link.rpc('verifyAddress', err => {
      if (err) {
        this.setState({ notifySuccess: false, notifyText: err })
      } else {
        this.setState({ notifySuccess: true, notifyText: 'Address matched!' })
      }
      setTimeout(() => {
        this.setState({ notifySuccess: false, notifyText: '' })
      }, 5000)
    })
  }

  renderSignerType (type) {
    if (type === 'lattice') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.lattice(18)}</div>
          <div>{'GridPlus'}</div>
        </div>
      )
    } else if (type === 'ledger') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.ledger(16)}</div>
          <div>{'Ledger'}</div>
        </div>
      )
    } else if (type === 'trezor') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.trezor(15)}</div>
          <div>{'Trezor'}</div>
        </div>
      )
    } else if (type === 'aragon') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.aragon(26)}</div>
          <div>{'Aragon Agent'}</div>
        </div>
      )
    } else if (type === 'seed' || type === 'ring') {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.flame(16)}</div>
          <div>{'Hot'}</div>
        </div>
      )
    } else {
      return (
        <div className='moduleItemSignerType'>
          <div className='moduleItemIcon'>{svg.mask(20)}</div>
          <div>{'Watch-only'}</div>
        </div>
      )
    }
  }

  render () {
    const activeAccount = this.store('main.accounts', this.props.account)

    let signer

    if (activeAccount.signer) {
      signer = this.store('main.signers', activeAccount.signer)
    } else if (activeAccount.smart)  {
      const actingSigner = this.store('main.accounts', activeAccount.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }

    const hardwareSigner = isHardwareSigner(activeAccount.lastSignerType)
    const watchOnly = isWatchOnly(activeAccount)
    const status = (signer && signer.status) || (hardwareSigner ? 'Disconnected' : 'No Signer')

    // const signerType = this.store('main.accounts', this.props.id, 'lastSignerType')
    // const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
    const account = this.store('main.accounts', this.props.id)

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
          <div className='moduleItemRow'>
            <div 
              className='moduleItem moduleItemSpace moduleItemButton' 
              style={{ flex: 6 }}
              onClick={() => {
                if (!signer) {
                  this.setState({
                    notifySuccess: false,
                    notifyText: hardwareSigner ? 'Signer Disconnected' : 'There is no signer for this account'
                  })

                  setTimeout(() => {
                    this.setState({ notifySuccess: false, notifyText: '' })
                  }, 5000)
                  
                  return
                }

                const crumb = {
                  view: 'expandedSigner', 
                  data: { signer: signer.id }
                }
                // link.send('nav:forward', 'dash', crumb)
                link.send('tray:action', 'navDash', crumb)
            }}>
              {this.renderSignerType(activeAccount.lastSignerType)}
              <div className='moduleItemSignerStatus'>
                {svg.lock(14)}
                <span>{status}</span>
              </div>
            </div>

            {!watchOnly ? (
              <div 
                className='moduleItem moduleItemButton' 
                onMouseDown={() => this.verifyAddress(hardwareSigner)}
              >
                {svg.doubleCheck(20)}
              </div>
            ) : null}
          </div>
          
          {this.state.notifyText ? (
            <div 
              className={'moduleItem cardShow'}
              style={{
                color: this.state.notifySuccess ? 'var(--good)' : 'var(--bad)'
              }}
            >
              {this.state.notifyText}
            </div>
          ) : null}
          {account.smart ? (
            <div className='moduleItem'>
              <div>{account.smart.type} Account</div>
              <div>DAO exists on this chain: ?</div>
              <div>Agent Address: {account.address}</div>
              <div>Acting Account: {account.smart.actor}</div>
              <div>DAO Address: {account.smart.dao}</div>
              <div>IPFS Gateway: {'https://ipfs.aragon.org'}</div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)
