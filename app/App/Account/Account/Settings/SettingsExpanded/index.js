import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

// import Verify from '../../Signer/Verify'

class Settings extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
        }
      })
    }
    this.state = {
      expand: false,
      name: ''
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
    this.nameObs = this.store.observer(() => {
      const name = this.store('main.accounts', this.props.account, 'name')
      if (name !== this.state.name) this.setState({ name })
    })
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.nameObs.remove()
  }

  render () {
    const account = this.store('main.accounts', this.props.account)
    return (
      <div className='accountViewScroll'>
        <div className='expandedModule'>
          <div className='panelBlock'>
            <div className='panelBlockTitle'>
              Name
            </div>
            <div className='panelBlockValues panelBlockItem'>
              <input
                type='text'
                tabIndex='-1'
                value={this.state.name} 
                onChange={(e) => {
                  this.setState({ name: e.target.value })
                  link.send('tray:renameAccount', this.props.account, e.target.value)
                }}
              />
            </div>
          </div>

          {account.smart ? (
            <div className='panelBlock'>
              <div className='panelBlockValues'>
                <div className='panelBlockValue panelBlockItem'>
                  Chain ID: {account.smart.chain && account.smart.chain.id}
                </div>
              </div>
            </div>
          ) : null}

          {/* <div className='panelBlock'>
            <div className='panelBlockTitle'>
              Signer
            </div>
            <div className='panelBlockValues'>
              {account.signer ? (
                <div className='panelBlockValue panelBlockItem'>
                  `${account.lastSignerType} signer connected`}
                </div>
              ) : (
                <div className='panelBlockValue panelBlockItem'>
                  {'signer disconnected'}
                </div>
              )}
              {/* <Verify 
                id={this.props.account}
              />
            </div>
          </div> */}
          {/* <div className='moduleRow'>ENS Name: {account.ensName  ? account.ensName : 'none'}</div> */}
          {/* <div className='moduleRow'>Account Added: {account.created}</div> */}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)