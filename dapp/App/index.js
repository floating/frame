import React from 'react'
import Restore from 'react-restore'
// import link from '../../resources/link'

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
    const background = dapp && dapp.color ? dapp.color.background : 'white'
    const color = dapp && dapp.color ? dapp.color.text : 'white'
    return (
      <div className='splash' style={{ background, color }}>
        <div className='top'>
          {dapp && dapp.color ? <div className='title'>{dapp.domain}</div> : null}
        </div>
      </div>
    )
  }
}

export default Restore.connect(App)
