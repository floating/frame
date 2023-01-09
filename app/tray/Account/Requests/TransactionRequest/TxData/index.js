import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class txData extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      copied: false
    }
  }

  render() {
    const req = this.props.req
    return (
      <div className='_txMain' style={{ animationDelay: 0.1 * this.props.i + 's' }}>
        <div className='_txMainInner'>
          <div className='_txLabel'>Data</div>
          <div
            className='_txMainValues'
            onClick={() => {
              link.send('nav:update', 'panel', { data: { step: 'viewData' } })
            }}
          >
            {req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
              req.decodedData && req.decodedData.method ? (
                <div className='_txMainValue'>
                  <span className={'_txDataValueMethod'}>
                    {(() => {
                      if (req.decodedData.method.length > 17)
                        return `${req.decodedData.method.substr(0, 15)}..`
                      return req.decodedData.method
                    })()}
                  </span>
                  {/* <span>{'via'}</span>
                  <span className={'_txDataValueMethod'}>{(() => {
                    if (req.decodedData.contractName.length > 11) return `${req.decodedData.contractName.substr(0, 9)}..`
                    return req.decodedData.contractName
                  })()}</span> */}
                </div>
              ) : (
                <div className='_txMainValue'>{'Unknown data present'}</div>
              )
            ) : (
              <div className='_txMainTag'>{'No Data Included'}</div>
            )}
            {req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
              <div className='_txMainTag _txMainTagWarning'>{'Sending Data!'}</div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(txData)
