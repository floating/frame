import React, {  createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
// import { isNetworkConnected, isNetworkEnabled } from '../../../../resources/utils/chains'
// import svg from '../../../resources/svg'

class DappDetails extends React.Component {
  updateOriginChain () {
    const origin = this.store('main.origins', this.props.originId)
    return (
      <div className='originSwapChainList'>
        {Object.keys(this.store('main.networks.ethereum')).filter(id => {
          return this.store('main.networks.ethereum', id, 'on')
        }).map(id => {
          const selected = origin.chain.id === parseInt(id)
          return (
            <div className={selected ? 'originChainItem originChainItemActive' : 'originChainItem'} 
            onClick={() => {
              link.send('tray:action', 'switchOriginChain', this.props.originId, parseInt(id), 'ethereum')
            }}>
              {this.store('main.networks.ethereum', id, 'name')}
            </div>
          )
        })}
      </div>
    )
  }

  render () {
    const origin = this.store('main.origins', this.props.originId)
    return (
      <div className='cardShow'>
        <div className='originSwapTitle'>
          Switch chain for:
        </div>
        <div className='originSwapOrigin'>
          {origin.name}
        </div>
        <div>{'launch dapp'}</div>
        <div>{this.updateOriginChain()}</div>
        <div className='removeOriginButton' onClick={() => {
          link.send('tray:action', 'removeOrigin', this.props.originId)
          link.send('tray:action', 'backDash')
        }}>
          Remove Origin
        </div>  
      </div>
    )
  }
  
}

export default Restore.connect(DappDetails)