import React, { useRef } from 'react'
import isUtf8 from 'isutf8'
import { isHexString } from '@ethersproject/bytes'

import { stripHexPrefix } from './../../../../../resources/utils'

function decodeMessage(rawMessage) {
  if (isHexString(rawMessage)) {
    const buff = Buffer.from(stripHexPrefix(rawMessage), 'hex')
    return buff.length === 32 || !isUtf8(buff) ? rawMessage : buff.toString('utf8')
  }

  // replace all multiple line returns with just one to prevent excess space in message
  return rawMessage.replaceAll(/[\n\r]+/g, '\n')
}

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

  let showMore = false
  if (outerRef.current && this.innerRef.current) {
    const inner = innerRef.current.clientHeight
    const wrap = outerRef.current.clientHeight + outerRef.current.scrollTop
    if (inner > wrap) showMore = true
  }

  return (
    <div ref={outerRef} className='signValue'>
      <div ref={innerRef} className='signValueInner'>
        {text}
      </div>
      {showMore ? <div className='signValueMore'>scroll to see more</div> : null}
    </div>
  )
}

const MessageToSign = ({ req }) => {
  const { id, handlerId, type, status, payload } = req

  const message = decodeMessage(payload.params[1])
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
