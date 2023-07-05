import React from 'react'
import styled from 'styled-components'

import iconsList from './icons.json'

const IconContainer = styled.div`
  width: ${(props) => props.size + 'px'};
  height: ${(props) => props.size + 'px'};
`

const StyledSvg = styled.svg`
  width: 100%;
  height: 100%;
`

const list = []
const icons = {}

iconsList.forEach((i) => {
  console.log(i)
  const Icon = ({ size = 100 }) => {
    console.log('size', size)
    return (
      <IconContainer size={size}>
        <StyledSvg viewBox={i.svg.viewBox.join(' ')}>
          <path fill='currentColor' d={i.svg.path} />
        </StyledSvg>
      </IconContainer>
    )
  }

  i.icon = (size) => <Icon size={size} />
  icons[i.name] = i
  list.push(i)
})

export { icons, list }
