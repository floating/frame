const Transfer = ({ symbol, displayValue, rate }) => {
  return (
    <>
      <div className='_txMainTransferring'>
        <div className='_txMainTransferringPart _txMainTransferringPartLarge'>
          <span className='_txMainTransferringSymbol'>{symbol}</span>
          <span className='_txMainTransferringAmount'>{displayValue}</span>
        </div>
        <div className='_txMainTransferringPart'>
          <span className='_txMainTransferringEq'>{'≈'}</span>
          <span className='_txMainTransferringEqSymbol'>{'$'}</span>
          <span className='_txMainTransferringEqAmount'>{(displayValue * rate).toFixed(2)}</span>
        </div>
      </div>
    </>
  )
}

export default Transfer
