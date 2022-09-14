import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

import Verify from '../Verify'

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
      <div ref={this.moduleRef}>
        <div className='previewButton'>
          <div className='panelBlockValues'>
            <div className='panelBlockButton panelBlockItem' onMouseDown={() => {
              const crumb = {
                view: 'expandedModule', 
                data: {
                  id: this.props.moduleId,
                  account: this.props.account
                }
              }
              link.send('nav:forward', 'panel', crumb)
            }}>
              Account Settings
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)