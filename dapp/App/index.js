import React from 'react'
import Restore from 'react-restore'

import DappTile from './DappTile'
import Native from '../../resources/Native'
import link from '../../resources/link'

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
    const currentView = frame.views[frame.currentView] || {}
    const currentDapp = currentView.dappId ? this.store('main.dapps', currentView.dappId) : ''

    // Hard code send dapp status for now
    const sendDapp =
      this.store('main.dapps', '0xe8d705c28f65bc3fe10df8b22f9daa265b99d0e1893b2df49fd38120f0410bca') || {}

    const loaderStyle =
      currentDapp && currentDapp.colors
        ? {
            borderTop: `3px solid ${currentDapp.colors.backgroundShade}`,
            borderRight: `3px solid ${currentDapp.colors.backgroundShade}`,
            borderBottom: `3px solid ${currentDapp.colors.backgroundShade}`,
            borderLeft: `3px solid ${currentDapp.colors.backgroundLight}`,
          }
        : {}

    return (
      <div className='splash'>
        <Native />
        <div className='overlay' />
        <div className='mainLeft'>
          <div
            className='accountTile'
            onClick={() => {
              link.send('unsetCurrentView')
            }}
          >
            <div className='accountIcon'></div>
          </div>
          <div className='dappIcons'>
            <div className='dappIconsScroll'>
              <div className='dappIconsWrap'>
                {Object.keys(store('main.dapps')).map((id, index) => {
                  return <DappTile key={`dapp-${index}`} ens={store('main.dapps', id, 'ens')} />
                })}
              </div>
            </div>
          </div>
        </div>
        <div className='main'>
          <div className='mainTop' />
          {currentDapp ? (
            <>
              <div
                className='mainDappBackground'
                style={{
                  background: currentDapp.colors ? currentDapp.colors.background : 'none',
                }}
              >
                <div className='mainDappBackgroundTop' />
                {!currentView.ready ? (
                  <div className='mainDappLoading'>
                    <div className='loader' style={loaderStyle} />
                  </div>
                ) : null}
              </div>
            </>
          ) : !currentView.ready ? (
            sendDapp.status === 'failed' ? (
              <div className='mainDappLoading'>
                <div className='mainDappLoadingText'>{'Send dapp failed to load'}</div>
              </div>
            ) : (
              <div className='mainDappLoading'>
                <div className='loader' />
              </div>
            )
          ) : null}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)

// <div className='mainApps'>
//   {Object.keys(store('main.dapps')).map(id => {
//     return (
//       <pre>
//         {JSON.stringify(store('main.dapps', id), null, 4)}
//       </pre>
//     )
//   })}
// </div>
