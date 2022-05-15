import React, { createRef } from 'react'
import Restore from 'react-restore'

import Dropdown from '../../../Components/Dropdown'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

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
    this.setState({ reqsTimes: reqs, activeCount: 0, reqsAverage: (Math.round(average(reqs) * 100) / 100).toFixed(2) })
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

  // clickHandler (e) {
  //   if (!e.composedPath().includes(this.ref.current)) {
  //     if (this.state.expanded) this.setState({ expanded: false })
  //   }
  // }

  // componentDidMount () {
  //   document.addEventListener('click', this.clickHandler.bind(this))
  // }

  // componentDidUnmount () {
  //   document.removeEventListener('click', this.clickHandler.bind(this))
  // }

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
    const { id, type, connection, changed, origin } = this.props
    const { active } = this.state

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    return (
      <>      
        <div 
          className='sliceOrigin'
          onClick={() => {
            this.store.notify('updateOriginChain', { origin: origin })
          }}
        >
          <div className={active ? 'sliceOriginIndicator sliceOriginIndicatorActive' : 'sliceOriginIndicator' } />
          <div className='sliceOriginTile'> 
            {origin}
          </div>
          <div className='sliceOriginReqs'> 
            <div className='sliceOriginReqsNumber'>{this.state.reqsAverage }</div>
            <div className='sliceOriginReqsLabel'>{'reqs/s'}</div>
          </div>
        </div>
        {this.state.expanded ? (
          <div>
            {'origin quick menu'}
          </div>
        ) : null}
      </>

    )
  }
}

const OriginModule = Restore.connect(_OriginModule)

class ChainModule extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expanded: true
    }
    this.ref = createRef()
  }

  // clickHandler (e) {
  //   if (!e.composedPath().includes(this.ref.current)) {
  //     if (this.state.expanded) this.setState({ expanded: false })
  //   }
  // }

  // componentDidMount () {
  //   document.addEventListener('click', this.clickHandler.bind(this))
  // }

  // componentDidUnmount () {
  //   document.removeEventListener('click', this.clickHandler.bind(this))
  // }

  renderHeader (origin, id) {
    return (
      <div 
        className='sliceTile sliceTileClickable'
        onClick={() => {
          this.setState({ expanded: !this.state.expanded })
        }}
      >
        <div className='sliceTileUsage'>
          <div className='sliceTileUsageCount'>{'4'}</div>
          <div className='sliceTileUsageDescription'>{'connected dapps'}</div>
        </div>
      </div>
    )
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
    const { id, type, connection, changed } = this.props

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    return (
      <div className='sliceContainer' ref={this.ref}>
        {false && this.renderHeader('connection', id)}
        {!this.state.expanded ? (
          <div className='sliceContainer'>
            <OriginModule origin={'send.frame.eth'} {...this.props} />
            <OriginModule origin={'uniswap.io'} {...this.props} />
            <OriginModule origin={'app.aave.eth'} {...this.props} />
            <div className='viewAllOrigin'>
              {'view all'}
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(ChainModule)
