import React from 'react'
import Restore from 'react-restore'
// import { CSSTransitionGroup } from 'react-transition-group'

// import ProviderRequest from './ProviderRequest'
// import TransactionRequest from './TransactionRequest'
// import SignatureRequest from './SignatureRequest'
// import ChainRequest from './ChainRequest'
// import AddTokenRequest from './AddTokenRequest'
// import SignTypedDataRequest from './SignTypedDataRequest'

import TxOverview from './TransactionRequest/TxMainNew/overview'

import RequestItem from '../../../../../resources/Components/RequestItem'
import RingIcon from '../../../../../resources/Components/RingIcon'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

class Requests extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      minimized: false
      // unlockInput: '',
      // unlockHeadShake: false
    }
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
  }

  // trezorPin (num) {
  //   this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
  //   if (this.tPin.length === 4) {
  //     link.rpc('trezorPin', this.props.account, this.tPin, (err, status) => {
  //       if (err) throw new Error(err)
  //     })
  //     this.tPin = ''
  //   }
  // }

  minimize() {
    this.setState({ minimized: true })
  }

  // unlockChange (e) {
  //   this.setState({ unlockInput: e.target.value })
  // }

  // unlockSubmit (e) {
  //   link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, (err, result) => {
  //     if (err) {
  //       this.setState({ unlockHeadShake: true })
  //       setTimeout(() => this.setState({ unlockHeadShake: false }), 1010)
  //     }
  //   })
  // }

  // keyPressUnlock (e) {
  //   if (e.key === 'Enter') {
  //     e.preventDefault()
  //     this.unlockSubmit()
  //   }
  // }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  // componentDidMount () {

  //   // link.send('tray:action', 'updateAccountModule', this.props.account, { height: this.moduleRef.current.clientHeight })
  // }

  renderPreview() {
    const reqCount = Object.keys(this.store('main.accounts', this.props.account, 'requests') || {}).length
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div
          className={'requestsPreview'}
          onClick={() => {
            const crumb = {
              view: 'expandedModule',
              data: {
                id: this.props.moduleId,
                account: this.props.account
              }
            }
            link.send('nav:forward', 'panel', crumb)
          }}
        >
          <div className={'requestPreviewContent'}>
            <div className={'requestPreviewContentTitle'}>
              <span style={reqCount ? { color: 'var(--good)' } : {}}>{svg.inbox(13)}</span>
              <span>{reqCount ? (reqCount === 1 ? '1 Request' : reqCount + ' Requests') : 'Requests'}</span>
            </div>
            <div className={'requestPreviewContentArrow'} style={reqCount ? { color: 'var(--good)' } : {}}>
              {svg.arrowRight(14)}
              {svg.arrowRight(14)}
              {svg.arrowRight(14)}
            </div>
          </div>
          <div className={'requestsPreviewArrow'}>
            <div className={'requestsPreviewArrow1'} />
          </div>
          {/* <div className={'requestsPreviewArrow2'} />
          <div className={'requestsPreviewArrow3'} /> */}
          <div className={'requestsPreviewOverlay'} />
        </div>
      </div>
    )
  }

  renderRequestGroup(origin, requests) {
    const groupName = this.store('main.origins', origin, 'name')
    const favicon = 'https://' + groupName + '/favicon.ico'
    const proxyFavicon = `https://proxy.pylon.link?type=icon&target=${encodeURIComponent(favicon)}`

    return (
      <ClusterBox>
        <div className='requestGroup'>
          {/* <RingIcon img={favicon} alt={'?'} small noRing /> */}
          <div className='requestGroupMain'>
            <div style={{ marginRight: '8px' }}>{svg.window(12)}</div>
            <div className='requestGroupName'>{groupName}</div>
          </div>
          <div className='requestGroupName'>{'clear all'}</div>
        </div>
        <Cluster>
          {!requests.length ? (
            <div key='noReq' className='noRequests'>
              No Pending Requests
            </div>
          ) : null}
          {requests.map((req, i) => {
            if (req.type === 'access') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Account Access'}
                  color={'var(--outerspace)'}
                  svgName={'accounts'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'sign') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Sign Message'}
                  color={'var(--outerspace)'}
                  svgName={'sign'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'signTypedData') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Sign Data'}
                  color={'var(--outerspace)'}
                  svgName={'sign'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'addChain') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Add Chain'}
                  color={'var(--outerspace)'}
                  svgName={'chain'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'switchChain') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Switch Chain'}
                  color={'var(--outerspace)'}
                  svgName={'chain'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'addToken') {
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={'Add Tokens'}
                  color={'var(--outerspace)'}
                  svgName={'tokens'}
                >
                  <Cluster>
                    <ClusterRow>
                      <ClusterValue grow={2}>
                        <div className='requestItemTitleSub' style={{ padding: '16px' }}>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>
                            {this.store('main.origins', req.origin, 'name')}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>
                  </Cluster>
                </RequestItem>
              )
            } else if (req.type === 'transaction') {
              const chainId = parseInt(req.data.chainId, 16)
              const chainName = this.store('main.networks.ethereum', chainId, 'name')
              const {
                primaryColor,
                icon,
                nativeCurrency: { symbol: currentSymbol = '?' }
              } = this.store('main.networksMeta.ethereum', chainId)
              const txMeta = { replacement: false, possible: true, notice: '' }
              const originName = this.store('main.origins', req.origin, 'name')
              return (
                <RequestItem
                  key={req.type + i}
                  req={req}
                  account={this.props.account}
                  handlerId={req.handlerId}
                  i={i}
                  title={`${chainName} Transaction`}
                  color={primaryColor ? `var(--${primaryColor})` : ''}
                  img={icon}
                >
                  <TxOverview
                    req={req}
                    chainName={chainName}
                    chainColor={primaryColor}
                    symbol={currentSymbol}
                    txMeta={txMeta}
                    originName={originName}
                    simple={true}
                  />
                </RequestItem>
              )
            }
          })}
        </Cluster>
        {/* <div className='requestContainer'>
          
        </div> */}
      </ClusterBox>
    )
  }

  renderExpanded() {
    // console.log('this.props', this.props)
    const activeAccount = this.store('main.accounts', this.props.account)
    // console.log('activeAccount', activeAccount)
    const requests = Object.values(activeAccount.requests || {})
      .sort((a, b) => {
        if (a.created > b.created) return -1
        if (a.created < b.created) return 1
        return 0
      })
      .filter((req) => {
        const elapsed = Date.now() - ((req && req.created) || 0)
        return elapsed > 1000
      })

    const originSortedRequests = {}
    requests.forEach((req) => {
      const origin = req.origin
      originSortedRequests[origin] = originSortedRequests[origin] || []
      originSortedRequests[origin].push(req)
    })
    const groups = Object.keys(originSortedRequests)

    return (
      <div className='accountViewScroll'>
        {groups.length === 0 ? (
          <div className='requestContainerWrap'>
            <div className='requestContainerEmpty'>{'NO PENDING REQUESTS'}</div>
          </div>
        ) : (
          groups.map((origin) => {
            return this.renderRequestGroup(origin, originSortedRequests[origin])
          })
        )}
      </div>
    )
  }
  render() {
    return this.props.expanded ? this.renderExpanded() : this.renderPreview()
  }
}

export default Restore.connect(Requests)
