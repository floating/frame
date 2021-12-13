import React from 'react'
import Restore from 'react-restore'
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
        <div className='mainLeft'>
          <div className='dappIcons'>
            <div className='dappIconsScroll'>
              <div className='dappIconsWrap'>
                <div className='dappIcon'>
                  {svg.ruby(26)}
                </div>
                <div className='dappIcon'>
                  {svg.inventory(22)}
                </div>
                <div className='dappIcon'>
                  {svg.sync(20)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='main'>
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
