import React from 'react'
import Restore from 'react-restore'

import DappTile from './DappTile'
import svg from '../../resources/svg'
import link from '../../resources/link'

class App extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { ready: false }
  }

  render () {
    const dapp = this.store(`main.dapp.details.${this.props.id}`)
    console.log('dapp info is ', dapp)
    let name = dapp ? dapp.domain : null
    if (name) {
      name = name.split('.')
      name.pop()
      name.reverse()
      name.forEach((v, i) => { name[i] = v.charAt(0).toUpperCase() + v.slice(1) })
      name = name.join(' ')
    }

    const frame = this.store('main.frames', window.frameId)
    const currentView = frame.views[frame.currentView] || {}
    const currentDapp = currentView.dappId ? this.store('main.dapps', currentView.dappId) : ''

    return (
      <div className='splash'>
        <div className='overlay' />
        <div className='mainLeft'>
          <div className='accountTile' onClick={() => {
            link.send('unsetCurrentView')
          }}>
            <div className='accountIcon'>
            </div>
          </div>
          <div className='dappIcons'>
            <div className='dappIconsScroll'>
              <div className='dappIconsWrap'>
                {Object.keys(store('main.dapps')).map(id => {
                  return (
                    <DappTile ens={store('main.dapps', id, 'ens')} />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className='main'>
          <div className='mainTop' />
          {currentDapp ? (
            <>
              <div className='mainDappBackground' style={{
                background: currentDapp.colors ? currentDapp.colors.background : 'none'
              }}>
                {!currentView.ready ? (
                  <div className='mainDappLoading'>
                    <div className='loader'
                      style={{
                        borderTop: `3px solid ${currentDapp.colors.backgroundShade}`,
                        borderRight: `3px solid ${currentDapp.colors.backgroundShade}`,
                        borderBottom: `3px solid ${currentDapp.colors.backgroundShade}`,
                        borderLeft: `3px solid ${currentDapp.colors.backgroundLight}`
                      }}
                    >
                    </div>
                  </div>
                ) : null}
              </div>
            </>
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
