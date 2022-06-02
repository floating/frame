import React, {  createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import { isNetworkConnected, isNetworkEnabled } from '../../../resources/utils/chains'
// import svg from '../../../resources/svg'

import DappDetails from './DappDetails'

function bySessionStartTime (a, b) {
  return b.session.startedAt - a.session.startedAt
}

function byLastUpdated (a, b) {
  return b.session.lastUpdatedAt - a.session.lastUpdatedAt
}

function getOriginsForChain (chain, origins) {
  const { connectedOrigins, disconnectedOrigins } = Object.entries(origins).reduce((acc, [id, origin]) => {
    if (origin.chain.id === chain.id) {
      const connected = isNetworkConnected(chain) &&
        (!origin.session.endedAt || origin.session.startedAt > origin.session.endedAt)

      acc[connected ? 'connectedOrigins' : 'disconnectedOrigins'].push({ ...origin, id })
    }

    return acc
  }, { connectedOrigins: [], disconnectedOrigins: [] })

  return {
    connected: connectedOrigins.sort(bySessionStartTime),
    disconnected: disconnectedOrigins.sort(byLastUpdated).filter(origin => (Date.now() - origin.session.lastUpdatedAt) < 60 * 60 * 1000)
  }
}

class Indicator extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      active: false
    }

    setTimeout(() => {
      this.setState({ active: true })
    }, 20)

    setTimeout(() => {
      this.setState({ active: false })
    }, 200)
  }

  render () {
    if (this.props.connected) {
      return <div className={this.state.active ? 'sliceOriginIndicator sliceOriginIndicatorActive' : 'sliceOriginIndicator' } />
    } else {
      return <div className='sliceOriginIndicator sliceOriginIndicatorOff' />
    }
  }
}

class _OriginModule extends React.Component {
  constructor (...args) {
    super(...args)

    this.state = {
      expanded: false,
      averageRequests: '0.0'
    }

    this.ref = createRef()
  }

  componentDidMount () {
    this.requestUpdates = setInterval(() => {
      if (this.props.connected) {
        this.updateRequestRate()
      }
    }, 1000)
  }

  componentWillUnmount () {
    clearInterval(this.requestUpdates)
  }

  updateRequestRate () {
    const { origin } = this.props
    const now = new Date().getTime()
    const sessionLengthSeconds = Math.max((now - origin.session.startedAt), 1000) / 1000
    this.setState({ averageRequests: (origin.session.requests / sessionLengthSeconds).toFixed(1) })
  }

  render () {
    const { origin, connected } = this.props

    return (
      <div>      
        <div 
          className='sliceOrigin'
          onClick={() => {
            link.send('tray:action', 'navDash', { view: 'dapps', data: { dappDetails:  origin.id }})
          }}
        >
          <Indicator key={origin.session.lastUpdatedAt} connected={connected} />
          <div className='sliceOriginTile'>
            {origin.name}
          </div> 
          <div className='sliceOriginReqs'>
            <div className='sliceOriginReqsNumber'>{this.state.averageRequests}</div>
            <div className='sliceOriginReqsLabel'>{'reqs/s'}</div>
          </div>
        </div>
        {this.state.expanded ? (
          <div>
            {'origin quick menu'}
          </div>
        ) : null}
      </div>
    )
  }
}

const OriginModule = Restore.connect(_OriginModule)

const ChainOrigins = ({ chain, origins }) => (
  <>
    <div className='originTitle'>{chain.name}</div>
    {origins.connected.map((origin) => <OriginModule origin={origin} connected={true} />)}
    {origins.disconnected.map((origin) => <OriginModule origin={origin} connected={false} />)}
  </>
)
  
class Dapps extends React.Component {
  getEnabledChains () {
    return Object.values(this.store('main.networks.ethereum')).filter(isNetworkEnabled)
  }

  render () {
    const enabledChains = this.getEnabledChains()
    const origins = this.store('main.origins')
    const originsCount = Object.values(origins).length
    const clearOriginsClickHandler = () => link.send('tray:action', 'clearOrigins')

    const { dappDetails } = this.props.data

    if (dappDetails) {
      return <DappDetails originId={dappDetails} />
    } else {
      return (
        <div>
          {
            enabledChains.map(chain => {
              const chainOrigins = getOriginsForChain(chain, origins)
  
              return chainOrigins.length === 0
                ? <></>
                : <ChainOrigins chain={chain} origins={chainOrigins} />
            })
          }
          <div className={`clearOriginsButton${originsCount === 0 ? ' clearOriginsButtonDisabled' : ''}`} onClick={clearOriginsClickHandler} >
            Clear All Origins
          </div>
        </div>
      ) 
    }
  }
}

export default Restore.connect(Dapps)
