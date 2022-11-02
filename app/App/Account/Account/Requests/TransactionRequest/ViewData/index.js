import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

const txFieldPriority = [
  'chainId',
  'nonce',
  'value',
  'data',
  'to',
  'from',
  'gasLimit',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas'
]

const SimpleTxJSON = ({ json, req }) => {
  return (
    <div className='simpleJson'>
      {Object.keys(json).filter((f) => {
        return txFieldPriority.indexOf(f) !== -1
      }).sort((a, b) => {
        const aIndex = txFieldPriority.indexOf(a) 
        const bIndex = txFieldPriority.indexOf(b) 
        return aIndex > bIndex ? 1 : aIndex < bIndex ? -1 : 0
      }).map((key, o) => (
        <div key={key + o} className='simpleJsonChild'>
          <div className=' simpleJsonKey simpleJsonKeyTx'>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          <div className='simpleJsonValue'>
            {typeof json[key] === 'object' ? (
              <SimpleJSON json={json[key]} key={key} />
            ) : (
              json[key]
            )}
            {key === 'nonce' ? (
              <div className='txNonceControl'>
                <div 
                  className='txNonceButton txNonceButtonLower' 
                  onMouseDown={() => {
                    link.send('tray:adjustNonce', req.handlerId, -1)
                  }}>
                  {svg.octicon('chevron-down', { height: 14 })}
                </div>
                <div className='txNonceButton txNonceButtonRaise' onMouseDown={() => link.send('tray:adjustNonce', req.handlerId, 1)}>
                  {svg.octicon('chevron-up', { height: 14 })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

//  <div className='txModuleTop'>
// <div className={'txModuleTopData txModuleTopDataExpanded'}>
  // <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
  // <div className='transactionDataLabel'>View Data</div>
  // <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
    // {svg.octicon('clippy', { height: 20 })}
  // </div>
// </div> 
// <div className='txModuleBody'>

class ViewData extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      copiedData: false
    }
  }

  copyData (data) {
    if (data) {
      link.send('tray:clipboardData', data)
      this.setState({ copiedData: true })
      setTimeout(_ => this.setState({ copiedData: false }), 1000)
    }
  }

  renderNonce () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    const { data } = req
    const tx = { nonce: 'TBD', ...data }
    const nonce = tx.nonce
    return (
      <div className='requestMetaNonce'>
        <div className='txNonceLabel'>Nonce</div>
        <div className={'txNonceNumber'}>
          {nonce}
        </div>
      </div>
    )
  }

  renderDecodedData () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    return req.decodedData ? (
      <div className='decodedDataContract'>
        <div className='decodedDataContractArgHeader'>Contract Method</div>
        <div className='dataUnverified'>unverified abi</div>
        <div className='dataSource'>{'abi source: ' + req.decodedData.source}</div>
        <div className='decodedDataContractTarget'>
          <div className='decodedDataSync decodedDataSyncLeft'>{svg.sync(16)}</div>
          <div className='decodedDataSync decodedDataSyncRight'>{svg.sync(16)}</div>
          <div className='decodedDataContractName'>
            {req.decodedData.contractName}
          </div>
          <div className='decodedDataContractMethod'>
            <div>{req.decodedData.method}</div>
          </div>
        </div>
        <div className='decodedDataContractArgHeader'>Inputs</div>
        {req.decodedData.args.map(a => {
          return (
            <div key={a.name} className='decodedDataContractArg'>
              <div className='overflowBox'>
                {a.type.indexOf('[]') ? (
                  a.value.split(',').map(i => <div key={i}>{i}</div>)
                ) : (
                  <div>{a.value}</div>
                )}
              </div>
              <div className='decodedDataSubtitle'>{a.name + ' (' + a.type + ')'}</div>
            </div>
          )
        })}
      </div>
    ) : 'Could not decode data..'
  }

  render () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    const { data } = req
    const tx = { nonce: 'TBD', ...data }
    return (
      <div className='accountViewScroll cardShow'>
        {/* <div className='txViewData'>
          <div className='txViewDataHeader'>{'Decoded Data'}</div>
          {this.renderDecodedData()}
        </div> */}
        <div className='txViewData'>
          <div className='txViewDataHeader'>{'Raw Transaction'}</div>
          <SimpleTxJSON json={tx} req={req} />
        </div>
      </div>
    )
  }

  renderOld () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    let nonce = parseInt(req.data.nonce, 'hex')
    if (isNaN(nonce)) nonce = 'TBD'

    return (
      <div className='txViewData '>
        {utils.toAscii(req.data.data || '0x') ? (
          <div className='transactionDataBodyInner'>
            <div>
              
            </div>
            
            <div className='txDataOverlayRaw'>
              <div className='txDataOverlayRawTitle'>{'Raw Transaction Data'}</div>
              <div className='txDataOverlayRawData' onClick={() => this.copyData(req.data.data)}>
                {this.state.copiedData ? (
                  <div className='txModuleDataBodyCopied'>
                    <div>Copied Data</div>
                    {svg.octicon('clippy', { height: 20 })}
                  </div>
                ) : null}
                {req.data.data}
              </div>
            </div>
          </div>
        ) : (
          <div className='txModuleTop'>
            <div className='txModuleTopData' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No Data
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default Restore.connect(ViewData)