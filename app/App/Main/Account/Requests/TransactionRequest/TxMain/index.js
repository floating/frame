import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'
import utils from 'web3-utils'

class TxRecipient extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      copied: false,
    }
  }
  copyAddress(data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout((_) => this.setState({ copied: false }), 1000)
  }
  hexToDisplayValue(hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }
  render() {
    const req = this.props.req
    const layer = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.props.chain.type, this.props.chain.id, 'nativeCurrency')
    const etherUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')
    const currentSymbol = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'symbol') || '?'
    return (
      <div className="_txMain">
        <div className="_txMainInner">
          <div className="_txMainValues">
            <div className="_txMainValue">
              <span className="_txMainValueSymbol">{currentSymbol}</span>
              <span className="_txMainValueAmount">{value}</span>
            </div>
            <div className="_txMainValue">
              <span className="_txMainValueEq">{'≈'}</span>
              <span className="_txMainValueEqSymbol">{'$'}</span>
              <span className="_txMainValueEqAmount">{(value * etherUSD).toFixed(2)}</span>
            </div>
          </div>
          <div className="_txLabel">Sending</div>
        </div>
      </div>
    )
  }
}

{
  /* <div className='transactionToAddressFull' onMouseDown={this.copyAddress.bind(this, req.data.to)}>
{this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : req.data.to}
</div> */
}

export default Restore.connect(TxRecipient)
