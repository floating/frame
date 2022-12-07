import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'
import { findUnavailableSigners, isHardwareSigner } from '../../../../../../resources/domain/signer'
import { accountPanelCrumb, signerPanelCrumb } from '../../../../../../resources/domain/nav'

import {
  Cluster,
  ClusterRow,
  ClusterColumn,
  ClusterValue
} from '../../../../../../resources/Components/Cluster'

const isWatchOnly = (account = {}) => {
  return ['address'].includes(account.lastSignerType.toLowerCase())
}

class Signer extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
            height: this.moduleRef.current.clientHeight
          })
        }
      })
    }
    this.state = {
      notifySuccess: false,
      notifyText: ''
    }
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  verifyAddress(hardwareSigner) {
    if (hardwareSigner) {
      // prompt for on-signer verification
      this.setState({ notifySuccess: false, notifyText: 'Verify address on signer' })
    }
    link.rpc('verifyAddress', (err) => {
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

  renderSignerType(type) {
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

  getCurrentStatus(activeSigner, hardwareSigner) {
    let status = ''
    let style = {
      marginLeft: '10px',
      padding: '12px'
    }

    if (activeSigner && activeSigner.status) {
      if (activeSigner.status.toLowerCase() === 'ok') {
        status = 'ready to sign'
        style.color = 'var(--good)'
      } else if (activeSigner.status.toLowerCase() === 'locked') {
        style.color = 'var(--moon)'
        status = activeSigner.status
      } else {
        status = activeSigner.status
      }
    } else if (hardwareSigner) {
      style.color = 'var(--bad)'
      status = 'Disconnected'
    } else {
      style.color = 'var(--bad)'
      status = 'No Signer'
    }

    return (
      <div className='clusterTag' style={style}>
        {status}
      </div>
    )
  }

  render() {
    const activeAccount = this.store('main.accounts', this.props.account)

    let activeSigner

    if (activeAccount.signer) {
      activeSigner = this.store('main.signers', activeAccount.signer)
    } else if (activeAccount.smart) {
      const actingSigner = this.store('main.accounts', activeAccount.smart.actor, 'signer')
      if (actingSigner) activeSigner = this.store('main.signers', actingSigner)
    }

    const hardwareSigner = isHardwareSigner(activeAccount.lastSignerType)
    const watchOnly = isWatchOnly(activeAccount)
    const status = this.getCurrentStatus(activeSigner, hardwareSigner)

    const account = this.store('main.accounts', this.props.id)

    return (
      <div className='balancesBlock' ref={this.moduleRef}>
        <div className='moduleHeader'>
          <span style={{ position: 'relative', top: '2px' }}>{svg.sign(19)}</span>
          <span>{'Signer'}</span>
        </div>
        <Cluster>
          <ClusterRow>
            <ClusterColumn>
              <ClusterValue
                onClick={() => {
                  const getUnavailableSigner = () => {
                    const signers = Object.values(this.store('main.signers'))
                    const unavailableSigners = findUnavailableSigners(activeAccount.lastSignerType, signers)
                    return unavailableSigners.length === 1 && unavailableSigners[0]
                  }
                  const signer = activeSigner || getUnavailableSigner()
                  if (!signer) {
                    this.setState({
                      notifySuccess: false,
                      notifyText: 'Signer Unavailable'
                    })
                    setTimeout(() => {
                      this.setState({ notifySuccess: false, notifyText: '' })
                    }, 5000)
                  }
                  const crumb = !!signer ? signerPanelCrumb(signer) : accountPanelCrumb()
                  link.send('tray:action', 'navDash', crumb)
                }}
              >
                <div
                  style={{
                    padding: '20px'
                  }}
                >
                  {this.renderSignerType(activeAccount.lastSignerType)}
                </div>
              </ClusterValue>
              <ClusterValue>{this.getCurrentStatus(activeSigner, hardwareSigner)}</ClusterValue>
            </ClusterColumn>
            {!watchOnly && (
              <ClusterColumn width={'80px'}>
                <ClusterValue onClick={() => this.verifyAddress(hardwareSigner)}>
                  {svg.doubleCheck(20)}
                </ClusterValue>
              </ClusterColumn>
            )}
          </ClusterRow>
          {this.state.notifyText && (
            <ClusterRow>
              <ClusterValue>
                <div
                  className='clusterTag'
                  style={{
                    color: this.state.notifySuccess ? 'var(--good)' : 'var(--bad)'
                  }}
                >
                  {this.state.notifyText}
                </div>
              </ClusterValue>
            </ClusterRow>
          )}
          {account.smart && (
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag'>
                  <div>{account.smart.type} Account</div>
                  <div>DAO exists on this chain: ?</div>
                  <div>Agent Address: {account.address}</div>
                  <div>Acting Account: {account.smart.actor}</div>
                  <div>DAO Address: {account.smart.dao}</div>
                  <div>IPFS Gateway: {'https://ipfs.aragon.org'}</div>
                </div>
              </ClusterValue>
            </ClusterRow>
          )}
        </Cluster>
      </div>
    )
  }
}

export default Restore.connect(Signer)
