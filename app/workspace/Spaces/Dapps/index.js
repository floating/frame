import React, { createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import { isNetworkConnected, isNetworkEnabled } from '../../../../resources/utils/chains'
import { chainUsesEth } from '../../../../resources/utils/chains'
import { displayName } from '../../../../resources/utils'
// import svg from '../../../../resources/svg'

import RingIcon from '../../../../resources/Components/RingIcon'

import DappDetails from './DappDetails'

function bySessionStartTime(a, b) {
  return b.session.startedAt - a.session.startedAt
}

function byLastUpdated(a, b) {
  return b.session.lastUpdatedAt - a.session.lastUpdatedAt
}

const originFilter = ['frame-internal', 'frame-extension']

function getOriginsForChain(chain, origins) {
  const { connectedOrigins, disconnectedOrigins } = Object.entries(origins).reduce(
    (acc, [id, origin]) => {
      if (origin.chain.id === chain.id && !originFilter.includes(origin.name)) {
        const connected =
          isNetworkConnected(chain) &&
          (!origin.session.endedAt || origin.session.startedAt > origin.session.endedAt)

        acc[connected ? 'connectedOrigins' : 'disconnectedOrigins'].push({ ...origin, id })
      }

      return acc
    },
    { connectedOrigins: [], disconnectedOrigins: [] }
  )

  return {
    connected: connectedOrigins.sort(bySessionStartTime),
    disconnected: disconnectedOrigins
      .sort(byLastUpdated)
      .filter((origin) => Date.now() - origin.session.lastUpdatedAt < 60 * 60 * 1000)
  }
}

class Indicator extends React.Component {
  constructor(props) {
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

  render() {
    if (this.props.connected) {
      return (
        <div
          className={
            this.state.active ? 'sliceOriginIndicator sliceOriginIndicatorActive' : 'sliceOriginIndicator'
          }
        />
      )
    } else {
      return <div className='sliceOriginIndicator sliceOriginIndicatorOff' />
    }
  }
}

class _OriginModule extends React.Component {
  constructor(...args) {
    super(...args)

    this.state = {
      expanded: false,
      averageRequests: '0.0'
    }

    this.ref = createRef()
  }

  componentDidMount() {
    this.requestUpdates = setInterval(() => {
      if (this.props.connected) {
        this.updateRequestRate()
      }
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.requestUpdates)
  }

  updateRequestRate() {
    const { origin } = this.props
    const now = new Date().getTime()
    const sessionLength = now - origin.session.startedAt
    const sessionLengthSeconds = sessionLength / Math.min(sessionLength, 1000)
    this.setState({ averageRequests: (origin.session.requests / sessionLengthSeconds).toFixed(2) })
  }

  render() {
    const { origin, connected } = this.props

    return (
      <div>
        <div
          className='sliceOrigin'
          onClick={() => {
            link.send('tray:action', 'navDash', { view: 'dapps', data: { dappDetails: origin.id } })
          }}
        >
          <Indicator key={origin.session.lastUpdatedAt} connected={connected} />
          <div className='sliceOriginTitle'>{origin.name}</div>
          <div className='sliceOriginReqs'>
            <div className='sliceOriginReqsNumber'>{this.state.averageRequests}</div>
            <div className='sliceOriginReqsLabel'>{'reqs/min'}</div>
          </div>
        </div>
        {this.state.expanded ? <div>{'origin quick menu'}</div> : null}
      </div>
    )
  }
}

const OriginModule = Restore.connect(_OriginModule)

const ChainOrigins = ({ chain: { name, id }, origins, primaryColor, icon }) => {
  const media = {
    format: 'image',
    source: icon,
    cdn: {}
  }
  const isEth = chainUsesEth(parseInt(id))
  return (
    <>
      <div className='originTitle'>
        <div className='originTitleIcon'>
          <RingIcon
            thumb={true}
            small={true}
            media={!isEth && media}
            svgName={isEth && 'eth'}
            alt={id}
            color={primaryColor ? `var(--${primaryColor})` : ''}
          />
        </div>
        <div className='originTitleText'>{displayName(name, 26)}</div>
      </div>
      {origins.connected.map((origin) => (
        <OriginModule key={origin.name} origin={origin} connected={true} />
      ))}
      {origins.disconnected.map((origin) => (
        <OriginModule key={origin.name} origin={origin} connected={false} />
      ))}
      {origins.connected.length === 0 && origins.disconnected.length === 0 ? (
        <div className='sliceOriginNoDapp'>{'No Dapp Recently Connected'}</div>
      ) : null}
    </>
  )
}

class Dapps extends React.Component {
  getEnabledChains() {
    return Object.values(this.store('main.networks.ethereum')).filter(isNetworkEnabled)
  }

  render() {
    const enabledChains = this.getEnabledChains()
    const origins = this.store('main.origins')

    const { dappDetails } = this.props.data

    if (dappDetails) {
      return <DappDetails originId={dappDetails} />
    } else {
      return (
        <div className='cardShow' style={{ padding: '32px' }}>
          {enabledChains.map((chain) => {
            const chainOrigins = getOriginsForChain(chain, origins)
            const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chain.id)

            return chainOrigins.length === 0 ? (
              <></>
            ) : (
              <ChainOrigins
                key={chain.id}
                chain={chain}
                origins={chainOrigins}
                primaryColor={primaryColor}
                icon={icon}
              />
            )
          })}
        </div>
      )
    }
  }
}

export default Restore.connect(Dapps)
