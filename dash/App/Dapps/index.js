import React, {  createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import { isNetworkConnected, isNetworkEnabled } from '../../../resources/utils/chains'
// import svg from '../../../resources/svg'

function bySessionStartTime (a, b) {
  return a.session.startedAt - b.session.startedAt
}

function byLastUpdated (a, b) {
  return a.session.lastUpdatedAt - b.session.lastUpdatedAt
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
    disconnected: disconnectedOrigins.sort(byLastUpdated)
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
      //return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } 
    // else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
    //   return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    // } 
    else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }
}

class _OriginModule extends React.Component {
  constructor (...args) {
    super(...args)

    this.state = {
      expanded: false
    }

    this.ref = createRef()
  }

  render () {
    const { origin, connected } = this.props

    return (
      <div>      
        <div 
          className='sliceOrigin'
          onClick={() => {
            link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'updateOriginChain', notifyData: { origin } }})
          }}
        >
          <Indicator key={origin.session.lastUpdatedAt} connected={connected} />
          <div className='sliceOriginTile'>
            {origin.name}
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

export default Restore.connect(Dapps)
