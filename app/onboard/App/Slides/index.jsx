import React from 'react'
import { SlideContainer, Slide } from '../styled'

import Intro from './Intro'
import Access from './Access'
import Extension from './Extension'
import Chains from './Chains'
import Accounts from './Accounts'
import Outro from './Outro'

const CurrentSlide = ({ slide, platform, nextSlide, onComplete }) => {
  if (slide === 0) return null
  else if (slide === 1) return <Intro nextSlide={nextSlide} />
  else if (slide === 2) {
    return <Access nextSlide={nextSlide} platform={platform} />
  } else if (slide === 3) return <Chains nextSlide={nextSlide} />
  else if (slide === 4) return <Accounts nextSlide={nextSlide} />
  else if (slide === 5) return <Extension nextSlide={nextSlide} />
  else if (slide === 6) return <Outro onComplete={onComplete} />
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
