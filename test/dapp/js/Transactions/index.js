const React = require('react')
const octicons = require('octicons')

module.exports = (props) => (
  <React.Fragment>
    {props.currentTransaction ? (
      <div className='currentTransaction'>
        <div className='back' onClick={props.toggleTransactions(true)} dangerouslySetInnerHTML={{__html: octicons['chevron-left'].toSVG({height: 40})}} />
        {Object.keys(props.currentTransaction).map((key, i) => (
          <div className='transaction-detail' key={i}>
            <div className='transaction-key'>{key.replace(/([A-Z])/g, ' $1')}</div>
            {props.currentTransaction[key]}
          </div>
        ))}
      </div>
    ) : (
      <div className='transactions'>
        <div className='back' onClick={props.toggleTransactions(false)} dangerouslySetInnerHTML={{__html: octicons['chevron-left'].toSVG({height: 40})}} />
        {Object.keys(props.transactions).length > 0 ? (
          <div className='tHash-wrap'>
            {Object.keys(props.transactions).map((tHash, i) => (
              <div className='tHash' key={i} onClick={props.setCurrentTransaction(tHash)}>
                {props.transactions[tHash].blockNumber === null ? (
                  <span className='tHash-pending' dangerouslySetInnerHTML={{__html: octicons['kebab-horizontal'].toSVG({height: 24})}} />
                ) : (
                  <span className='tHash-done' dangerouslySetInnerHTML={{__html: octicons['primitive-dot'].toSVG({height: 24})}} />
                )}
                {tHash}
              </div>
            ))}
          </div>
        ) : (
          <div className='no-transactions'>No transactions have been made yet</div>
        )}
      </div>
    )}
  </React.Fragment>
)
