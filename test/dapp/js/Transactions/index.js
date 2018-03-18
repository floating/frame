const React = require('react')
const octicons = require('octicons')

module.exports = (props) => (
  <React.Fragment>
    {props.currentTransaction ? (
      <div className='currentTransaction'>
        {}
      </div>
    ) : (
      <div className='transactions'>
        <div className='back' onClick={props.toggleTransactions} dangerouslySetInnerHTML={{__html: octicons['arrow-left'].toSVG({height: 36})}} />
        {props.transactions.length > 0 ? (
          <div className='tHash-wrap'>
            {props.transactions.map((tHash, i) => (<div className='tHash' key={i} onClick={props.getTransaction(tHash)}>{tHash}</div>))}
          </div>
        ) : (
          <div className='no-transactions'>No transactions have been made yet</div>
        )}
      </div>
    )}
  </React.Fragment>
)
