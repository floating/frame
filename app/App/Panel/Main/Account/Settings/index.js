import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      expand: false
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 
  render () {
    const account = this.store('main.accounts', this.props.id)
    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{'Settings'}</div>  
        <div className='moduleMain moduleMainSettings'> 
          <div>{account.name}</div> 
          <div>Status: {account.status}</div>
          <div>Last Signer: {account.lastSignerType}</div>
          <div>ENS Name: {account.ensName  ? account.ensName : 'none'}</div>
          <div>Signer Connected: {account.signer ? 'yes' : 'no'}</div>
          <div>Account Added: {account.created}</div>
          <div className='moduleButton moduleButtonBad' onMouseDown={() => {
            link.rpc('removeAccount', this.props.id, {}, () => {
              // console.log('Removed account ', address)
            })
          }}>Remove This Account</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)