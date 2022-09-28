import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

// import Verify from '../Verify'

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
      name: '',
      showMore: false
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
      <div ref={this.moduleRef}>
        <div className='balancesBlock'>
          <div className='moduleHeaderBlank'>
          </div>
          <div className='moduleMainPermissions'>
            <div 
              className='moduleItem moduleItemButton' 
              onClick={() => {
                // const crumb = {
                //   view: 'expandedModule', 
                //   data: {
                //     id: this.props.moduleId,
                //     account: this.props.account
                //   }
                // }
                // link.send('nav:forward', 'panel', crumb)
                this.setState({ showMore: !this.state.showMore })
              }
            }>
              {this.state.showMore ? 'less' : 'more'}
            </div>
            {this.state.showMore ? (
              <>
                {/* <div className='moduleItem moduleItemButton cardShow'>
                  {'Show Name with ENS'}
                </div> */}
                <div className='moduleItem moduleItemButton cardShow'>
                  {'Update Name'}
                </div>
                <div className='moduleItem moduleItemButton cardShow' onClick={() => {
                  link.rpc('removeAccount', this.props.account, {}, () => {})
                }}
                  style={{ color: 'var(--bad)' }}
                >
                  {'Remove Account'}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)