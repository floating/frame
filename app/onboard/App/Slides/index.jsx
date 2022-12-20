import { SlideContainer, Slide } from '../styled'

import Intro from './Intro'
import Access from './Access'
import Extension from './Extension'
import Chains from './Chains'
import Accounts from './Accounts'
import Outro from './Outro'

const CurrentSlide = (props) => {
  const { slide } = props
  if (slide === 0) return null
  else if (slide === 1) return <Intro {...props} />
  else if (slide === 2) {
    return <Access {...props} />
  } else if (slide === 3) return <Extension {...props} />
  else if (slide === 4) return <Chains {...props} />
  else if (slide === 5) return <Accounts {...props} />
  else if (slide === 6) return <Outro {...props} />
  else return <Slide>{'Cannot find slide'}</Slide>
}

const Slides = (props) => {
  return (
    <SlideContainer>
      <CurrentSlide {...props} />
    </SlideContainer>
  )
}

export default Slides
