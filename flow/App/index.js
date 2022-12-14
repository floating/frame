import { LinkExternal } from '@githubprimer/octicons-react'
import React from 'react'
import Restore from 'react-restore'
import link from '../../resources/link'

// import Main from './Main'
// import Local from './Local'
// import Notify from './Notify'
// import Phase from './Phase'
// import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

class Flow extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.input = React.createRef()
    this.state = {
      input: ''
    }
  }
  // componentDidMount(){
  //   this.input.current.focus()
  // }
  // trigger () {
  //   link.rpc('flowCommand', this.state, (err, sres) => {
  //     console.log(err, res)
  //   })
  // }
  render() {
    return (
      <div className='dapps'>
        <div ref={this.input} className='bar'>
          <input
            onChange={(e) => {
              this.setState({ input: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.target.blur()
                this.trigger()
              }
            }}
          />
        </div>
        <div className='dappWrap'>
          <div
            className='dapp'
            onMouseDown={() =>
              link.rpc('openDapp', 'matt.eth', {}, (err) => {
                console.log('err', err)
              })
            }
          >
            <div className='dappIcon'></div>
            <div className='dappName'>matt.eth</div>
          </div>
          <div
            className='dapp'
            onMouseDown={() =>
              link.rpc('openDapp', 'frame.eth', {}, (err) => {
                console.log('err', err)
              })
            }
          >
            <div className='dappIcon'></div>
            <div className='dappName'>frame.eth</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Aragon</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Compound</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Dapp 1</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Dapp 2</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
          <div className='dapp'>
            <div className='dappIcon'></div>
            <div className='dappName'>Wallet</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Flow)
