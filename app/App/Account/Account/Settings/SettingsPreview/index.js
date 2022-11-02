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
      showMore: false,
      newName: '',
      editName: false
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
                this.setState({ showMore: !this.state.showMore, editName: false })
              }
            }>
              {this.state.showMore ? 'less' : 'more'}
            </div>
            {this.state.showMore ? (
              <>
                {this.state.editName ? (
                  <div
                    key={'input'} 
                    className='moduleItem cardShow moduleItemInput'
                  >
                    {/* <div className='moduleItemEditNameTitle'>
                      {'Update Account Name'}
                    </div> */}
                    <div
                      className='moduleItemEditName'
                    >
                      <input 
                        autoFocus
                        type='text'
                        tabIndex='-1'
                        value={this.state.name} 
                        onChange={(e) => {
                          this.setState({ name: e.target.value })
                          link.send('tray:renameAccount', this.props.account, e.target.value)
                        }}
                        onKeyPress={e => { 
                          if (e.key === 'Enter') {
                            this.setState({ editName: false })
                          }
                        }}
                      />
                      {/* <div className='moduleItemInputSubmit'>
                        {svg.check(18)}
                      </div> */}
                    </div>
                  </div> 
                ) : (
                  <div 
                    className='moduleItem moduleItemButton'
                    onClick={() => {
                      this.setState({ editName: true })
                    }}
                  >
                    {'Update Name'}
                  </div>
                )}
                <div 
                  className='moduleItem moduleItemButton'
                  style={this.state.editName ? { 
                    opacity: 0.3, 
                    pointerEvents: 'none',
                    color: 'var(--bad)'
                  } : { 
                    opacity: 1,
                    color: 'var(--bad)'
                  } }
                  onClick={() => {
                    link.rpc('removeAccount', this.props.account, {}, () => {})
                  }}
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