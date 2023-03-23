import React, { useRef } from 'react'
import isUtf8 from 'isutf8'
import { isHexString } from '@ethersproject/bytes'

import { stripHexPrefix } from './../../../../../resources/utils'
import { TextDecoder } from 'util'

const t = new TextDecoder('utf-8')

const fromHexString = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

function decodeMessage(rawMessage) {
  if (isHexString(rawMessage)) {
    const buff = fromHexString(stripHexPrefix(rawMessage))
    return buff.length === 32 || !isUtf8(buff) ? rawMessage : t.decode(buff)
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
