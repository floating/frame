import React from 'react'
import { Proceed } from '../styled'

export const SlideProceed = ({ children, ...props }) => (
  <Proceed role='button' {...props}>
    {children}
  </Proceed>
)
