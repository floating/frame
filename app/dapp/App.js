import React from 'react'
import Restore from 'react-restore'

import link from '../../resources/link'
import Native from '../../resources/Native'

const FailedToLoad = () => {
  return (
    <div className='mainDappLoadingText'>
      <div>{'Send dapp failed to load'}</div>
    </div>
  )
}

const MainnetDisconnected = () => {
  return (
    <>
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
    </>
  )
}

const Error = ({ isMainnetConnected }) => {
  if (!isMainnetConnected) {
    return <MainnetDisconnected />
  }

  return <FailedToLoad />
}

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = { ready: false }
  }

  render() {
    const dapp = this.store(`main.dapp.details.${this.props.id}`)
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

    const shouldDisplayError =
      (sendDapp.status !== 'ready' && !isMainnetConnected) || sendDapp.status === 'failed'

    return (
      <div className='splash'>
        <Native />
        <div className='main'>
          <div className='mainTop' />
          <div className='mainDappLoading'>
            {shouldDisplayError ? (
              <Error isMainnetConnected={isMainnetConnected} />
            ) : (
              !ready && <div className='loader' />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
