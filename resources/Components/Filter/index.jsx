import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'

class Filter extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      expand: false
    }
    // this.e = { p: ['QXJyb3dVcA==', 'QXJyb3dVcA==', 'QXJyb3dEb3du', 'QXJyb3dEb3du', 'QXJyb3dMZWZ0', 'QXJyb3dSaWdodA==', 'QXJyb3dMZWZ0', 'QXJyb3dSaWdodA==', 'Yg==', 'YQ=='], i: 0 }
  }
  // h (e) {
  //   if (this.e.p.indexOf(btoa(e.key)) < 0 || btoa(e.key) !== this.e.p[this.e.i]) {
  //     this.e.i = 0
  //   } else {
  //     e.preventDefault()
  //     this.e.i++
  //     if (this.e.p.length === this.e.i) {
  //       this.e.i = 0
  //       if (this.state.l === true) {
  //         this.setState({l: false})
  //       } else {
  //         this.setState({l: true})
  //       }
  //     }
  //   }
  // }
  // componentDidMount () {
  //   document.addEventListener('keydown', this.h.bind(this))
  // }
  // componentWillUnmount () {
  //   document.removeEventListener('keydown', this.h.bind(this))
  // }
  glitch(el) {
    return (
      <div className={this.state.glitchOn ? 'glitch glitchOn' : 'glitch'}>
        {[...Array(10).keys()].map((i) => (
          <div key={i + 'hg'} className='line'>
            {el}
          </div>
        ))}
        {!this.state.glitchOn ? <div className='line lastLine'>{el}</div> : null}
      </div>
    )
  }
  render() {
    const { buttonActionName, buttonAction } = this.props
    return (
      <div className='filter'>
        <div className='filterWrap'>
          <div className='filterIcon'>{svg.search(18)}</div>
          <input
            className='filterInput'
            spellCheck={false}
            tabIndex={-1}
            onChange={(e) => this.props.onInput(e.target.value)}
          />
        </div>
        {buttonActionName ? (
          <div
            className='filterButton'
            onClick={() => {
              this.setState({ glitchOn: false })
              if (buttonAction) buttonAction()
            }}
            onMouseEnter={() => this.setState({ glitchOn: true })}
            onMouseOver={() => this.setState({ glitchOn: true })}
            onMouseLeave={() => this.setState({ glitchOn: false })}
          >
            {this.glitch(
              <div className='filterButtonInner'>
                {'+'}
                {svg.chain(14)}
              </div>
            )}
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Filter)
