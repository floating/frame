import React from 'react'
import Restore from 'react-restore'

import link from '../../resources/link'
import Native from '../../resources/Native'

const FailedToLoad = () => {
  return (
    <div className='mainDappLoading'>
      <div className='mainDappLoadingText'>
        <div>{'Send dapp failed to load'}</div>
      </div>
    </div>
  )
}

const MainnetDisconnected = () => {
  return (
    <div className='mainDappLoading'>
      <div className='mainDappLoadingText'>
        <div>{'Mainnet connection required'}</div>
        <div>{'to resolve ENS for Send dapp'}</div>
      </div>
      <div
        className='mainDappEnableChains'
        onClick={() => {
          link.send('tray:action', 'navDash', { view: 'chains', data: {} })
          setTimeout(() => {
            link.send('frame:close')
          }, 100)
        }}
      >
        View Chains
      </div>
    </div>
  )
}

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = { ready: false }
  }

  render() {
    const dapp = this.store(`main.dapp.details.${this.props.id}`)
    console.log('dapp info is ', dapp)
    let name = dapp ? dapp.domain : null
    if (name) {
      name = name.split('.')
      name.pop()
      name.reverse()
      name.forEach((v, i) => {
        name[i] = v.charAt(0).toUpperCase() + v.slice(1)
      })
      name = name.join(' ')
    }

    const frame = this.store('main.frames', window.frameId)
    const { ready } = frame.views[frame.currentView] || {}

    // Hard code send dapp status for now
    const sendDapp =
      this.store('main.dapps', '0xe8d705c28f65bc3fe10df8b22f9daa265b99d0e1893b2df49fd38120f0410bca') || {}

    const mainnet = this.store('main.networks.ethereum.1')
    const isMainnetConnected =
      mainnet.on && (mainnet.connection.primary.connected || mainnet.connection.secondary.connected)

<<<<<<< HEAD
    const ErrorComponent = () => {
      if (!isMainnetConnected) {
        return <MainnetDisconnected />
      }

      return <FailedToLoad />
    }
    const shouldDisplayError = ready === undefined || sendDapp.status === 'failed'
=======
    const errorComponent =
      !ready &&
      (sendDapp.status !== 'ready' && !isMainnetConnected ? (
        <MainnetDisconnected />
      ) : sendDapp.status === 'failed' ? (
        <FailedToLoad />
      ) : null)
>>>>>>> c6122d84 (fix typo)

    return (
      <div className='splash'>
        <Native />
        <div className='main'>
          <div className='mainTop' />
          {shouldDisplayError && <ErrorComponent />}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
