import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'
import svg from '../../../../../../../../resources/svg'
import link from '../../../../../../../../resources/link'

import TxDataOverlay from './TxDataOverlay'
import TxFeeOverlay from './TxFeeOverlay'

class TxModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.state = {
      active: false
    }
  }


  // setActive (active) {
  //   if (!this.props.req || !this.props.req.data || !this.props.req.data.data) return
  //   this.setState({ active })
  //   clearTimeout(this.expandActiveTimeout)
  //   if (active) {
  //     document.addEventListener('mousedown', this.mouseDetect.bind(this))
  //     this.setState({ expandActive: true })
  //   } else {
  //     document.removeEventListener('mousedown', this.mouseDetect)
  //     this.expandActiveTimeout = setTimeout(() => {
  //       this.setState({ expandActive: false })
  //     }, 320)
  //   }
  // }


  render () {
    const { overlay } = this.props
    if (overlay === 'fee') {
      return <TxFeeOverlay {...this.props} />
    } else if (overlay === 'data') {
      return <TxDataOverlay {...this.props} />
    } else {
      return null
    }
  }
}

export default Restore.connect(TxModule)
