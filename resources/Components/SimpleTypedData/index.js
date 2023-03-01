const SimpleJSON = ({ json }) => {
  return (
    <div className='simpleJson'>
      {Object.keys(json).map((key, o) => (
        <div key={key + o} className='simpleJsonChild'>
          <div className='simpleJsonKey simpleJsonKeyTx'>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          <div className='simpleJsonValue'>
            {typeof json[key] === 'object' ? <SimpleJSON json={json[key]} key={key} /> : json[key]}
          </div>
        </div>
      ))}
    </div>
  )
}

const SimpleTypedDataInner = ({ typedData }) =>
  typedData.domain ? (
    <div className='signTypedDataInner'>
      <div className='simpleJsonHeader'>Domain</div>
      <SimpleJSON json={typedData.domain} />
      <div className='simpleJsonHeader'>Message</div>
      <SimpleJSON json={typedData.message} />
    </div>
  ) : (
    <div className='signTypedDataSection'>
      <SimpleJSON
        json={typedData.reduce((data, elem) => {
          data[elem.name] = elem.value
          return data
        }, {})}
      />
    </div>
  )

export const SimpleTypedData = ({ req }) => {
  const type = req.type
  const typedData = req.typedMessage.data || {}

  return type === 'signTypedData' || type === 'signErc20Permit' ? (
    <div className='accountViewScroll cardShow'>
      <div className='txViewData'>
        <div className='txViewDataHeader'>{'Raw Typed Data'}</div>
        <SimpleTypedDataInner {...{ typedData }} />
      </div>
    </div>
  ) : (
    <div className='unknownType'>{'Unknown: ' + req.type}</div>
  )
}
