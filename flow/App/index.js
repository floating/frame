import React from 'react'
import Restore from 'react-restore'
import link from '../link'

// import Main from './Main'
// import Local from './Local'
// import Notify from './Notify'
// import Phase from './Phase'
// import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

class Flow extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.input = React.createRef()
    this.state = {
      input: ''
    }
  }
  componentDidMount(){
    this.input.current.focus()
  }
  trigger () {
    link.rpc('flowCommand', this.state, (err, sres) => {
      console.log(err, res)
    })
  }
  render () {
    return (
      <div ref={this.input} className='bar'>
        <input
          onChange={(e) => {
            this.setState({ input: e.target.value })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
              this.trigger()
            }
          }} 
        />
      </div>
    )
  }
}

export default Restore.connect(Flow)
