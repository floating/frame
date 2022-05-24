import React, {  createRef } from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
// import svg from '../../../resources/svg'

const average = (array) => (array.reduce((a, b) => a + b) / array.length).toFixed(2)

class _OriginModule extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expanded: false,
      active: false,
      activeCount: 0,
      reqsAverage: 0,
      reqsTimes: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
    this.ref = createRef()
  }
  
  averageReqs () {
    const reqs = this.state.reqsTimes
    reqs.push(this.state.activeCount)
    reqs.shift()
    this.setState({
      reqsTimes: reqs, 
      activeCount: 0, 
      reqsAverage: (Math.round(average(reqs) * 100) / 100).toFixed(2) 
    })
  }

  componentDidMount () {
    const setActiveRandom = () => {
      const isActive = Math.round(Math.random() * 1 + 0.3)
      if (isActive) {
        clearTimeout(this.clearTimeout)
        this.setState({ active: false })
        setTimeout(() => {
          this.setState({ active: true })
          this.setState({ activeCount: ++this.state.activeCount })
          this.clearTimeout = setTimeout(() => {
            this.setState({ active: false })
          }, 1000)
        }, 50)
      }
      setTimeout(() => setActiveRandom(), Math.round(Math.random() * 500))
    }
    setInterval(() => this.averageReqs(), 1000)
    setActiveRandom()
  }

  indicator (status) {
    if (status === 'connected') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    } else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }
  render () {
    const { origin } = this.props
    const { active } = this.state

    return (
      <div>      
        <div 
          className='sliceOrigin'
          onClick={() => {
            link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'updateOriginChain', notifyData: { origin } }})
          }}
        >
          <div className={active ? 'sliceOriginIndicator sliceOriginIndicatorActive' : 'sliceOriginIndicator' } />
          <div className='sliceOriginTile'> 
            {origin.name}
          </div>
          <div className='sliceOriginReqs'> 
            <div className='sliceOriginReqsNumber'>{this.state.reqsAverage}</div>
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

const NetworkOrigins = ({ network, origins }) => 
  <>
    <div className='originTitle'>{network.name}</div>
    {origins.map((origin) => <OriginModule origin={origin} />)}
  </>

class Dapps extends React.Component {
  render () {
    const allOrigins = this.store('main.origins')
    const enabledNetworks = Object.values(this.store('main.networks.ethereum')).filter(network => network.on)
    const networkOrigins = {}

    enabledNetworks.forEach((network) => {
      const origins = Object.values(allOrigins).filter((origin) => origin.chain.id === network.id)
      networkOrigins[network.id] = { network, origins }
    })

    return (
      <div>
        {Object.values(networkOrigins).map(({ network, origins }) => origins.length === 0 ? <></> : <NetworkOrigins network={network} origins={origins} />)}
      </div>
    ) 
  }
}

export default Restore.connect(Dapps)
