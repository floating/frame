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
    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{'Account Settings'}</div>  
        <div style={{ padding: '60px' }}>
          <div>Remove Signer</div>
          <div>if smart account...</div>
          <div>Acting Address</div>
          <div>Display DAO Address (or ens lookup)</div>
          <div>IPFS gateway URL with input</div>
          <div>When it is a smart contract display if the account works on current network (Catch smart accounts setup errors and disable smart account on that network, reinitialize on network change)</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)