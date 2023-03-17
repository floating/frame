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

import MoveToPylon from './MoveToPylon'

const onComplete = () => {
  link.send('tray:action', 'navReplace', 'dash')
  link.send('frame:close')
}

const Slides = ({ platform }) => {
  return (
    <>
      <SlideTitle>{'Chain preset updates'}</SlideTitle>
      <MoveToPylon />
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
          {'Use Custom Preset'}
        </PylonConfirmButtonSub>
      </PylonConfirm>
    </>
  )
}

export default Slides
