import React from 'react'
import Restore from 'react-restore'

import DappTile from './DappTile'
import svg from '../../resources/svg'

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
    // const background = dapp && dapp.color ? dapp.color.background : 'black'
    // const color = dapp && dapp.color ? dapp.color.text : 'white'
    return (
      <div className='splash'>
        <div className='overlay' />
        <div className='mainLeft'>
          <div className='accountTile'>
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
          <div className='mainApps'>
            {Object.keys(store('main.dapps')).map(id => {
              return (
                <pre>
                  {JSON.stringify(store('main.dapps', id), null, 4)}
                </pre>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
