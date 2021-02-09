import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../../svg'
import link from '../../../../../../../link'

class TxData extends React.Component {
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
    const { req, active } = this.props
    return (
      <div className='txModuleMain'>
        {utils.toAscii(req.data.data || '0x') ? (
          <div className='txModuleTop'>
            <div className={active ? 'txModuleTopData txModuleTopDataExpanded' : 'txModuleTopData'}>
              <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
              <div className='transactionDataLabel'>View Data</div>
              <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
                {svg.octicon('clippy', { height: 20 })}
              </div>
            </div>
            <div className='txModuleBody'>
              <div className='transactionDataBodyInner' onMouseDown={() => this.copyData(req.data.data)}>
                {this.state.copiedData ? (
                  <div className='txModuleDataBodyCopied'>
                    <div>Copied Raw Data</div>
                    {svg.octicon('clippy', { height: 20 })}
                  </div>
                ) : (
                  <div>
                    {req.decodedData ? (
                      <div className='decodedDataContract'>
                        <div className='dataUnverified'>unverified abi</div>
                        <div className='dataSource'>{'abi source: ' + req.decodedData.source}</div>
                        <div className='decodedDataContractTarget'>
                          <div className='decodedDataSync decodedDataSyncLeft'>{svg.sync(20)}</div>
                          <div className='decodedDataSync decodedDataSyncRight'>{svg.sync(20)}</div>
                          <div className='decodedDataContractName'>
                            {req.decodedData.contractName}
                          </div>
                          <div className='decodedDataContractMethod'>
                            <div>{req.decodedData.method}</div>
                          </div>
                        </div>
      
                        {req.decodedData.args.map(a => {
                          return (
                            <div key={a.name} className='decodedDataContractArg'>
                              <div className='overflowBox'>
                                {a.type.indexOf('[]') ? (
                                  a.value.split(',').map(i => <div>{i}</div>)
                                ) : (
                                  <div>{a.value}</div>
                                )}
                              </div>
                              <div className='decodedDataSubtitle'>{a.name + ' (' + a.type + ')'}</div>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                    <div className='rawDataHeader'>{'Raw Data'}</div>
                    <div>{req.data.data}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className='txModuleTop'>
            <div className='txModuleTopData' style={{ justifyContent: 'center' }}>
              No Data
            </div>
          </div>
        )}
      </div>
    )
  }
}

class TxModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.state = {
      active: false
    }
  }

  mouseDetect (e) {
    if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
      this.setActive(false)
    }
  }

  setActive (active) {
    if (!this.props.req || !this.props.req.data || !this.props.req.data.data) return
    this.setState({ active })
    clearTimeout(this.expandActiveTimeout)
    if (active) {
      document.addEventListener('mousedown', this.mouseDetect.bind(this))
      this.setState({ expandActive: true })
    } else {
      document.removeEventListener('mousedown', this.mouseDetect)
      this.expandActiveTimeout = setTimeout(() => {
        this.setState({ expandActive: false })
      }, 320)
    }
  }

  render () {
    const style = {}
    if (this.state.active) {
      style.height = '324px'
      style.transform = `translateY(${3}px)`
    } else {
      style.height = '30px'
      style.transform = `translateY(${this.props.top}px)`
    }

    if (this.state.expandActive) {
      style.zIndex = '200000000'
    } else {
      style.zIndex = '20'
    }

    return (
      <div className='txModule' style={style} onMouseDown={() => this.setActive(true)} ref={this.moduleRef}>
        <TxData {...this.props} {...this.state} />
      </div>
    )
  }
}

export default Restore.connect(TxModule)
