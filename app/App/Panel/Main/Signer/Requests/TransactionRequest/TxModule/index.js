import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../../svg'
import link from '../../../../../../../link'



class TxData extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = { 
      copiedData: false
    }
  }

  copyData (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedData: true })
    setTimeout(_ => this.setState({ copiedData: false }), 1000)
  }
  
  render () {
    const { req, active } = this.props

    return (
      <div className='txModuleMain'>
        <div className='txModuleTop'>
          {utils.toAscii(req.data.data || '0x') ? (
            <div className={active ? 'txModuleTopData txModuleTopDataExpanded' : 'txModuleTopData'}>
              <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 26 })}</div>
              <div className='transactionDataLabel'>View Data</div>
              <div className='transactionDataIndicator' onMouseDown={() => this.copyData(req.data.data)}>
                {svg.octicon('clippy', { height: 20 })}
              </div>
            </div>
          ) : 'No Data '}
        </div>
        <div className='txModuleBody'>
          <div className='transactionDataBodyInner' onMouseDown={() => this.copyData(req.data.data)}>
            {this.state.copiedData ? (
              <div className='txModuleDataBodyCopied'>
                <div>Copied</div>
                {svg.octicon('clippy', { height: 20 })}
              </div>
            ) : req.data.data}
          </div>
        </div>
      </div>
    )
  }
}

class TxModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.moduleRef = React.createRef()
    this.state = { 
      active: false
    }
  }

  mouseDetect (e) {
    if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
      this.setState({ active: false })
      document.removeEventListener('mousedown', this.mouseDetect)
    }
  }

  setActive (active) {
    this.setState({ active })
    clearTimeout(this.expandActiveTimeout)
    if (active) {
      document.addEventListener('mousedown', this.mouseDetect.bind(this))
      this.expandActiveTimeout = setTimeout(() => {
        this.setState({ expandActive: true })
      }, 600)
    } else {
      this.setState({ expandActive: false })
    }
  }

  render () {
    const style = {}
    if (this.state.active) {
      style.height = '324px'
      style.transform = `translateY(${3}px)`
    } else {
      style.height = '30px'
      style.transform = `translateY(${this.props.top}px)`
    }

    return (
      <div className='txModule' style={style} onMouseDown={() => this.setActive(true)} ref={this.moduleRef}>
        <TxData {...this.props} {...this.state}/>
      </div>
    )
  }
}

export default Restore.connect(TxModule)
