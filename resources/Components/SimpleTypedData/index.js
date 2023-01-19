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

export const SimpleTypedDataInner = ({ typedData }) =>
  typedData.domain ? (
    <>
      <div className='signTypedDataSection'>
        <div className='signTypedDataTitle'>Domain</div>
        <SimpleJSON json={typedData.domain} />
      </div>
      <div className='signTypedDataSection'>
        <div className='signTypedDataTitle'>Message</div>
        <SimpleJSON json={typedData.message} />
      </div>
    </>
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

export default SimpleTypedData = ({ req, originName }) => {
  const type = req.type
  const payload = req.payload
  const typedData = payload.params[1] || {}

  const messageToSign = (
    <div className='signTypedData'>
      <SimpleTypedDataInner {...{ typedData }} />
    </div>
  )

  return type === 'signTypedData' || 'signErc20Permit' ? (
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
