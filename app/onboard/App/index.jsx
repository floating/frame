import React from 'react'
import Restore from 'react-restore'

import Native from '../../../resources/Native'

import { Onboard, DevControls, DevControlButton } from './styled'

import Slides from './Slides'
import link from '../../../resources/link'

class App extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      slide: 1
    }
  }

  render() {
    const platform = this.store('platform')
    return (
      <Onboard>
        <Native />
        <div className='frameOverlay' />
        <Slides
          slide={this.state.slide}
          platform={platform}
          prevSlide={() => {
            const prevSlide = --this.state.slide
            this.setState({ slide: prevSlide < 1 ? 1 : prevSlide })
          }}
          nextSlide={() => {
            const nextSlide = ++this.state.slide
            this.setState({ slide: nextSlide > 6 ? 6 : nextSlide })
          }}
          onComplete={() => {
            link.send('tray:action', 'completeOnboarding')
            link.send('tray:action', 'navReplace', 'dash')
          }}
        />
        {/* <DevControls>
          <DevControlButton
            onClick={() => {
              const prevSlide = --this.state.slide
              this.setState({ slide: prevSlide < 1 ? 1 : prevSlide })
            }}
          >
            back
          </DevControlButton>
          <DevControlButton
            onClick={() => {
              const nextSlide = ++this.state.slide
              this.setState({ slide: nextSlide > 6 ? 6 : nextSlide })
            }}
          >
            next
          </DevControlButton>
        </DevControls> */}
      </Onboard>
    )
  }
}
export default Restore.connect(App)
