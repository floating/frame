import React, { useRef } from 'react'

function getRequestClass(status) {
  let requestClass = 'signerRequest'
  if (status === 'success') requestClass += ' signerRequestSuccess'
  if (status === 'declined') requestClass += ' signerRequestDeclined'
  if (status === 'pending') requestClass += ' signerRequestPending'
  if (status === 'error') requestClass += ' signerRequestError'

  return requestClass
}

const Message = ({ text }) => {
  const outerRef = useRef(null)
  const innerRef = useRef(null)

  const shouldShowMore = () => {
    if (!outerRef.current || !innerRef.current) return false

    const inner = innerRef.current.clientHeight
    const wrap = outerRef.current.clientHeight + outerRef.current.scrollTop
    return inner > wrap
  }

  return (
    <div ref={outerRef} className='signValue'>
      <div ref={innerRef} className='signValueInner'>
        {text}
      </div>
      {shouldShowMore() ? <div className='signValueMore'>scroll to see more</div> : null}
    </div>
  )
}

const MessageToSign = ({ req }) => {
  const { id, handlerId, type, status } = req

  const message = req.data.decodedMessage
  const requestClass = getRequestClass(status)

  return (
    <div key={id || handlerId} className={requestClass}>
      {type === 'sign' ? (
        <div className='approveRequest'>
          <div className='approveTransactionPayload'>
            <Message text={message} />
          </div>
        </div>
      ) : (
        <div className='unknownType'>{'Unknown: ' + type}</div>
      )}
    </div>
  )
}

export default MessageToSign
