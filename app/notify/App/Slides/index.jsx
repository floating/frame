import React, { useState } from 'react'
import {
  SlideContainer,
  Slide,
  SlideTitle,
  SlideScroller,
  PylonConfirm,
  PylonConfirmButton,
  PylonConfirmButtonSub
} from '../styled'

import link from '../../../../resources/link'

import Proceed from './Proceed'

import MoveToPylon from './MoveToPylon'

const CurrentSlide = ({ slide, platform, setTitle, setProceed }) => {
  if (slide === 0) return null
  else if (slide === 1) return <MoveToPylon setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 2) return <Access platform={platform} setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 3) return <Chains setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 4) return <Omnichain setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 5) return <Accounts setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 6) return <Extension setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 7) return <SwitchChains setTitle={setTitle} setProceed={setProceed} />
  // else if (slide === 8) return <Outro setTitle={setTitle} setProceed={setProceed} />
  else return <Slide>{'Cannot find slide'}</Slide>
}

const onComplete = () => {
  link.send('tray:action', 'navReplace', 'dash')
  link.send('frame:close')
}

const prevSlide = (currentSlide, setSlide) => {
  const prevSlide = --currentSlide
  setSlide(prevSlide < 1 ? 1 : prevSlide)
}

const nextSlide = (currentSlide, setSlide) => {
  const nextSlide = ++currentSlide
  setSlide(nextSlide > 8 ? 8 : nextSlide)
}

const Slides = ({ platform }) => {
  const [title, setTitle] = useState()
  const [proceed, setProceed] = useState({})
  const [slide, setSlide] = useState(1)

  return (
    <SlideContainer>
      <SlideTitle key={title}>{title}</SlideTitle>
      <SlideScroller>
        <CurrentSlide slide={slide} platform={platform} setTitle={setTitle} setProceed={setProceed} />
      </SlideScroller>
      <PylonConfirm>
        <PylonConfirmButton
        // onClick={() => {
        //   link.send('tray:action', 'migrateToPylonConnections')
        //   link.send('tray:action', 'mutePylonMigrationNotice')
        // }}
        >
          {'Use Pylon'}
        </PylonConfirmButton>
        <PylonConfirmButtonSub
        // onClick={() => {
        //   link.send('tray:action', 'mutePylonMigrationNotice')
        // }}
        >
          {'Use a Custom Preset'}
        </PylonConfirmButtonSub>
      </PylonConfirm>
    </SlideContainer>
  )
}

export default Slides
