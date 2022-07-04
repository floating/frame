import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'

class txData extends React.Component {
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
  render() {
    const req = this.props.req
    return (
      <div className='_txData'>
        <div className='_txDataInner'>
          <div
            className='_txDataValue'
            onClick={() => {
              this.props.overlayMode('data')
            }}
          >
            {req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
              req.decodedData && req.decodedData.method ? (
                <>
                  <span>{'Sending Data: '}</span>
                  <span className={'_txDataValueMethod'}>
                    {(() => {
                      if (req.decodedData.method.length > 17)
                        return `${req.decodedData.method.substr(0, 15)}..`
                      return req.decodedData.method
                    })()}
                  </span>
                </>
              ) : (
                <span>{'Sending Data!'}</span>
              )
            ) : (
              'No Data'
            )}
          </div>
          <div className='_txLabel'>Data</div>
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

export default Restore.connect(txData)
