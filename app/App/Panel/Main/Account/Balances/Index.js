import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      openActive: false,
      open: false,
      selected: 0,
      shadowTop: 0,
      expand: false
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 
  // componentWillUnmount () {
  //   this.resizeObserver.disconnect()
  // }
  renderBalance (known, k, i) {
    const address = this.store('main.accounts', this.props.id, 'address')
    const balance = this.store('balances', address)
    const token = known[k]
    return (
      <div className='signerBalance' key={k} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceLogo'>
          <img src={token.logoURI} />
        </div>
        <div className='signerBalanceCurrency'>
          <span>{token.symbol}</span><span className='signerBalanceCurrencySmall'>{token.name}</span>
        </div>
        <div className='signerBalanceName'>
          <span className='signerBalanceCurrentPrice'>{token.usdDisplayRate}</span>
        </div>
        <div className='signerBalanceValue' style={(token.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '14px' } : {}}>
          {(balance === undefined ? '-.------' : token.displayBalance)}
        </div>
        <div className='signerBalanceEquivalent'>
          {token.usdDisplayValue}
        </div>
      </div>
    )
  }
  render () {
    const address = this.store('main.accounts', this.props.id, 'address')
    const { type, id } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'
    const balance = this.store('balances', address.toLowerCase())
    const tokens = this.store('main.accounts', address, 'tokens') || {}
    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    const known = Object.assign({}, tokens.known, {
      default: {
        chainId: 1,
        name: 'Ether',
        decimals: 18,
        address: '0x',
        logoURI: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
        symbol: currentSymbol,
        balance,
        displayBalance: balance === undefined ? '-.------' : '' + parseFloat(balance).toFixed(6).toLocaleString(),
        floatBalance: parseFloat(balance || 0).toFixed(6),
        usdRate: etherUSD,
        usdDisplayRate: '$' + (Math.floor(etherUSD * 100) / 100).toLocaleString(),
        usdValue: Math.floor((parseFloat(balance || 0) * etherUSD) * 100) / 100,
        usdDisplayValue: '$' + (Math.floor((parseFloat(balance || 0) * etherUSD) * 100) / 100).toLocaleString()
      }
    })
    let knownList = Object.keys(known).sort((a, b) => {
      if (a === 'default') return -1
      if (b === 'default') return 1
      return known[a].usdValue > known[b].usdValue ? -1 : known[a].usdValue < known[b].usdValue ? 1 : 0
    })
    if (!this.state.expand) knownList = knownList.slice(0, 5)
    // const offsetTop = (selected * 47) + 10
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>{'account balances'}</div>        
        {knownList.map((k, i) => this.renderBalance(known, k, i))}
        {knownList.length <= 1 && this.state.expand ? (
          <div className='signerBalanceNoTokens'>
            No other token balances found
          </div>
        ) : null}
        <div className='signerBalanceTotal'>
          <div className='signerBalanceShowAll' onMouseDown={() => this.setState({ expand: !this.state.expand })}>
            {this.state.expand ? 'Show Less' :  'Show All'}
          </div>
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>
              {'Total: '}
            </div>
            <div className='signerBalanceTotalValue'>
              {'$' + knownList.map(k => known[k].usdValue).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)
