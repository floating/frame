import { useState } from 'react'
import link from '../link'

const useCopiedMessage = (value) => {
  const [showMessage, setShowMessage] = useState(false)

  const copyToClipboard = () => {
    link.send('tray:clipboardData', value)
    setShowMessage(true)
    setTimeout(() => setShowMessage(false), 1000)
  }

  return [showMessage, copyToClipboard]
}

export default useCopiedMessage
