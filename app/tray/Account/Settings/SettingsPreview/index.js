import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

class Settings extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
            height: this.moduleRef.current.clientHeight
          })
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

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
    this.nameObs = this.store.observer(() => {
      const name = this.store('main.accounts', this.props.account, 'name')
      if (name !== this.state.name) this.setState({ name })
    })
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.nameObs.remove()
  }

  render() {
    return (
      <div ref={this.moduleRef}>
        <div className='balancesBlock'>
          <Cluster>
            <ClusterRow>
              <ClusterValue
                onClick={() => {
                  this.setState({ showMore: !this.state.showMore, editName: false })
                }}
              >
                <div className='moduleItem'>{this.state.showMore ? 'less' : 'more'}</div>
              </ClusterValue>
            </ClusterRow>
            {this.state.showMore ? (
              <>
                {this.state.editName ? (
                  <ClusterRow>
                    <ClusterValue allowPointer={true}>
                      <div key={'input'} className='moduleItem cardShow moduleItemInput'>
                        <div className='moduleItemEditName'>
                          <input
                            autoFocus
                            type='text'
                            tabIndex='-1'
                            value={this.state.name}
                            onChange={(e) => {
                              this.setState({ name: e.target.value })
                              link.send('tray:renameAccount', this.props.account, e.target.value)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                this.setState({ editName: false })
                              }
                            }}
                          />
                        </div>
                      </div>
                    </ClusterValue>
                  </ClusterRow>
                ) : (
                  <ClusterRow>
                    <ClusterValue
                      onClick={() => {
                        this.setState({ editName: true })
                      }}
                    >
                      <div className='moduleItem cardShow'>{'Update Name'}</div>
                    </ClusterValue>
                  </ClusterRow>
                )}
                <ClusterRow>
                  <ClusterValue
                    onClick={() => {
                      link.rpc('removeAccount', this.props.account, {}, () => {})
                    }}
                    style={
                      this.state.editName
                        ? {
                            opacity: 0.3,
                            pointerEvents: 'none',
                            color: 'var(--bad)'
                          }
                        : {
                            opacity: 1,
                            color: 'var(--bad)'
                          }
                    }
                  >
                    <div className='moduleItem cardShow'>{'Remove Account'}</div>
                  </ClusterValue>
                </ClusterRow>
              </>
            ) : null}
          </Cluster>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)
