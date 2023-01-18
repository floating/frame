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

import RequestItem from '../../../../resources/Components/RequestItem'
import RingIcon from '../../../../resources/Components/RingIcon'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../resources/Components/Cluster'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class Requests extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      minimized: false
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

  minimize() {
    this.setState({ minimized: true })
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

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
          style={reqCount ? { background: 'var(--ghostA)' } : {}}
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
            <div
              className={'requestsPreviewArrow1'}
              style={reqCount ? { background: 'var(--ghostB)' } : {}}
            />
          </div>
          <div className={'requestsPreviewOverlay'} style={reqCount ? { opacity: '1' } : { opacity: '0' }} />
        </div>
      </div>
    )
  }

  renderRequestGroup(origin, requests) {
    const groupName = this.store('main.origins', origin, 'name')
    // const favicon = `https://s2.googleusercontent.com/s2/favicons?sz=256&domain_url=https://` + groupName
    // const proxyFavicon = `https://proxy.pylon.link?type=icon&target=${encodeURIComponent(favicon)}`

    return (
      <ClusterBox>
        <div className='requestGroup'>
          {/* <img src={proxyFavicon} width='24px' height='24px' />
          <RingIcon img={favicon} alt={'?'} small noRing /> */}
          <div className='requestGroupMain'>
            <div style={{ marginRight: '8px' }}>{svg.window(12)}</div>
            <div className='requestGroupName'>{groupName}</div>
          </div>
          <div
            className='requestGroupButton'
            onClick={() => {
              link.send('tray:clearRequestsByOrigin', this.props.account, origin)
            }}
          >
            {svg.x(14)}
            <div className='requestGroupButtonLabel'>{'clear all'}</div>
          </div>
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
                  <div style={{ height: '10px' }} />
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
                  <div style={{ height: '10px' }} />
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
                  <div style={{ height: '10px' }} />
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
                  <div style={{ height: '10px' }} />
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
                  <div style={{ height: '10px' }} />
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
                  <div style={{ height: '10px' }} />
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
                    originName={originName}
                    simple={true}
                  />
                </RequestItem>
              )
            }
          })}
        </Cluster>
      </ClusterBox>
    )
  }

  renderExpanded() {
    const activeAccount = this.store('main.accounts', this.props.account)
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
      <div className='accountViewScroll' style={{ paddingTop: '40px' }}>
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
