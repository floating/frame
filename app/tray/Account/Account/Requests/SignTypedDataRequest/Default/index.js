import React from 'react'

const SimpleJSON = ({ json }) => {
  return (
    <div className='simpleJson'>
      {Object.keys(json).map((key, o) => (
        <div key={key + o} className='simpleJsonChild'>
          <div className='simpleJsonKey'>{key}:</div>
          <div className='simpleJsonValue'>
            {typeof json[key] === 'object' ? <SimpleJSON json={json[key]} key={key} /> : json[key]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DefaultTypedSignature = ({ req, originName }) => {
  const type = req.type
  const payload = req.payload
  const typedData = payload.params[1] || {}

  const messageToSign = typedData.domain ? (
    <div className='signTypedData'>
      <div className='signTypedDataInner'>
        <div className='signTypedDataSection'>
          <div className='signTypedDataTitle'>Domain</div>
          <SimpleJSON json={typedData.domain} />
        </div>
        <div className='signTypedDataSection'>
          <div className='signTypedDataTitle'>Message</div>
          <SimpleJSON json={typedData.message} />
        </div>
      </div>
    </div>
  ) : (
    <div className='signTypedData'>
      <div className='signTypedDataInner'>
        <div className='signTypedDataSection'>
          <SimpleJSON
            json={typedData.reduce((data, elem) => {
              data[elem.name] = elem.value
              return data
            }, {})}
          />
        </div>
      </div>
    </div>
  )
  return type === 'signTypedData' ? (
    <div className='approveRequest'>
      <div className='approveTransactionPayload'>
        <>
          <div className='requestMeta'>
            <div className='requestMetaOrigin'>{originName}</div>
          </div>
          {messageToSign}
        </>
      </div>
    </div>
  ) : (
    <div className='unknownType'>{'Unknown: ' + req.type}</div>
  )
}
