import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'

class Block extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', props.id, {
          height: this.moduleRef.current.clientHeight,
        })
      }
    })
  }
  componentDidMount() {
    this.resizeObserver.observe(this.moduleRef.current)
  }
  componentWillUnmount() {
    this.resizeObserver.disconnect()
  }
  render() {
    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{this.props.moduleId}</div>
        <div className='moduleMain'>
          <div className='cardShow'>{`Module Not Found`}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Block)
