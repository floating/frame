import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../../../../resources/svg'
import link from '../../../../../../../../resources/link'

class TxModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.state = {
      active: false
    }
  }

  // mouseDetect (e) {
  //   if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
  //     this.setActive(false)
  //   }
  // }

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
    if (this.props.overlayMode === 'fee') {
      return (
        <div className='txOverlay cardShow'>
          <div className='txOverlayTitle'>Adjust Fee</div>
        </div>
      )
    } else {
      return null
    }
  }
}

export default Restore.connect(TxModule)