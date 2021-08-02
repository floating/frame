import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../../../../resources/svg'
import link from '../../../../../../../../../resources/link'

//  <div className='txModuleTop'>
// <div className={'txModuleTopData txModuleTopDataExpanded'}>
  // <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
  // <div className='transactionDataLabel'>View Data</div>
  // <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
    // {svg.octicon('clippy', { height: 20 })}
  // </div>
// </div> 
// <div className='txModuleBody'>

class TxDataOverlay extends React.Component {
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

  

  render () {
    const { req, overlayMode } = this.props
    return (
      <div className='txOverlay cardShow'>
        <div className='txOverlayTitle'>Transaction Data</div>
        <div className='txOverlayClose' onMouseDown={() => overlayMode()}>{svg.octicon('x', { height: 16 })}</div>
        <div className='txDataOverlay'>
          {utils.toAscii(req.data.data || '0x') ? (
            <div className='transactionDataBodyInner' onMouseDown={() => this.copyData(req.data.data)}>
              {this.state.copiedData ? (
                <div className='txModuleDataBodyCopied'>
                  <div>Copied Data</div>
                  {svg.octicon('clippy', { height: 20 })}
                </div>
              ) : (
                <div>
                  {req.decodedData ? (
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
                  ) : 'Could not decode data..'}
                  <div className='txDataOverlayRawTitle'>{'Raw Transaction Data'}</div>
                  <div className='txDataOverlayRaw'>{req.data.data}</div>
                </div>
              )}
            </div>
          ) : (
            <div className='txModuleTop'>
              <div className='txModuleTopData' style={{ justifyContent: 'center' }}>
                No Data
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxDataOverlay)