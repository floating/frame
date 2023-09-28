import svg from '../../../resources/svg'
import styled, { createGlobalStyle, css } from 'styled-components'
import link from '../../../resources/link'
import useStore from '../../../resources/Hooks/useStore.js'
import React, { useState, useRef, useEffect } from 'react'

const GlobalStyle = createGlobalStyle`
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0px;
    font-family: 'MainFont';
    font-weight: 400;
    color: var(--outerspace);
  }
`

const Label = styled.div`
  position: absolute;
  white-space: nowrap;
  opacity: ${({ isVisible }) => (isVisible ? '1' : '0')};
  transform: ${({ isVisible }) => (isVisible ? 'translateY(0px)' : 'translateY(6px)')};
  transition: all 0.14s linear;
  top: -33px;
  background: var(--ghostB);
  border-radius: 10px;
  height: 20px;
  font-size: 10px;
  letter-spacing: 0.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 8px;
  text-transform: uppercase;
  box-shadow: 0px 2px 6px -1px var(--ghostX);
`

const DockIcon = styled.div`
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  margin: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--ghostA);
  border-radius: 16px;
  border-bottom: 1px solid var(--ghostAZ);
  box-shadow: 0px 2px 4px -1px var(--ghostY);
  transform: translate3d(0, 0, 0.00001);
  transition: transform 0.05s linear;
  user-select: none;
  /* 
  div {
    background: linear-gradient(45deg, #ffc312, #00a8ff);
    -webkit-background-clip: text;
    color: transparent;
  }

  svg {
    -webkit-background-clip: text;
    color: transparent;
  } */

  * {
    pointer-events: none;
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }
`

const DockIconBreak = styled.div`
  width: 2px;
  height: 48px;
  background: var(--ghostY);
  border-radius: 1.5px;
  margin: 8px;
  transform: translateY(6px);
`

const DockWrap = styled.div`
  position: absolute;
  top: 0px;
  left: -200px;
  right: -200px;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const DockCard = styled.div`
  position: absolute;
  top: 64px;
  height: 68px;
  box-sizing: border-box;
  transform: translateY(-8px);
  opacity: ${({ hide }) => (hide ? '0' : '1')};
  border-radius: 24px;
  background: var(--ghostAZ);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 6px 7px 7px 7px;
  border-bottom: 1px solid var(--ghostZ);
  box-shadow: 0px 12px 12px -10px var(--ghostY), 0px -12px 24px -10px var(--ghostY);
  transform: translate3d(0, 0, 0.00001);
`

const Wrap = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0px;
  transition: var(--standard);
  overflow: hidden;
`

const Dock = () => {
  const frameState = useStore('windows.workspaces', window.frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const { space } = nav

  const setHide = () => {
    setHideDockWrap(true)
    clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      link.send('workspace:nav:update:data', window.frameId, { hidden: true })
    }, 500)
  }

  const setShow = () => {
    clearTimeout(hideTimeout)
    setHideDockWrap(false)
    link.send('workspace:nav:update:data', window.frameId, { hidden: false })
  }

  const hidden = false //  (nav.space === 'dapp' && hideDockWrap) || (nav.space !== 'dapp' && nav.space !== 'command')

  const [hoveredIcon, setHoveredIcon] = useState(null)
  const [hideDockWrap, setHideDockWrap] = useState(false)
  const [dockWidth, setDockWidth] = useState(0)
  const [mouseX, setMouseX] = useState(null)
  const [mouseY, setMouseY] = useState(null)
  const dockRef = useRef(null)
  const iconsRef = useRef([])

  const [animateIconSize, setAnimateIconSize] = useState(true)

  const handleMouseEnter = () => {
    setAnimateIconSize(true)
    setTimeout(() => {
      setAnimateIconSize(false)
    }, 100)
  }

  const handleMouseLeave = () => {
    setAnimateIconSize(true)
    setMouseX(0)
  }

  const handleMouseMove = (e) => {
    const dockRect = dockRef.current.getBoundingClientRect()
    setMouseX(e.clientX - dockRect.left)
    setMouseY(e.clientY - dockRect.top)
  }
  const calculateStyling = (iconIndex) => {
    const baseWidth = 48 // Original width of the icon
    const baseHeight = 48 // Original height of the icon
    const baseShadow = 2.4 // Initial shadow blur radius
    const baseBorderRadius = 16 // Initial border-radius

    if (mouseX === null || !iconsRef.current[iconIndex]) {
      return [baseWidth, baseHeight, baseShadow, baseBorderRadius, 1] // Default content scale is 1
    }

    const iconRect = iconsRef.current[iconIndex].getBoundingClientRect()
    const iconCenter = iconRect.left + iconRect.width / 2 - dockRef.current.getBoundingClientRect().left
    const distance = Math.abs(mouseX - iconCenter)
    const threshold = iconRect.width * 3

    const mouseXFadeZone = 42

    if (distance < threshold) {
      const growth = (0.32 * (threshold - distance)) / threshold
      const adjustedGrowth = growth * Math.min(mouseY / mouseXFadeZone, 1)
      const scale = 1 + adjustedGrowth
      const shadow = baseShadow * scale * scale * scale * scale
      const borderRadius = baseBorderRadius * scale
      return [baseWidth * scale, baseHeight * scale, shadow, borderRadius, scale]
    }

    return [baseWidth, baseHeight, baseShadow, baseBorderRadius, 1] // Default content scale is 1
  }

  useEffect(() => {
    if (iconsRef.current.length) {
      let totalWidth = 0
      iconsRef.current.forEach((icon) => {
        if (icon) {
          const rect = icon.getBoundingClientRect()
          totalWidth += rect.width + 16
        }
      })
      setDockWidth(totalWidth)
    }
  }, [])

  return (
    <DockWrap
      hide={hidden}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dockRef}
    >
      <DockCard hide={hidden} width={dockWidth}>
        {[
          {
            type: 'space',
            icon: svg.wand(16),
            label: 'Command',
            onClick: () => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'command' })
            }
          },
          {
            type: 'space',
            icon: svg.pulse(16),
            label: 'Dashboard',
            onClick: () => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'dashboard' })
            }
          },
          {
            type: 'space',
            icon: svg.contact(16),
            label: 'Contacts',
            onClick: () => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'contacts' })
            }
          },
          { type: 'break' },
          {
            type: 'dapp',
            icon: svg.ruby(16),
            label: 'aave',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          {
            type: 'dapp',
            icon: svg.bars(16),
            label: 'ens',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          {
            type: 'dapp',
            icon: svg.seedling(16),
            label: 'curve',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          {
            type: 'dapp',
            icon: svg.infinity(16),
            label: 'safe',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          {
            type: 'dapp',
            icon: svg.telescope(16),
            label: 'uniswap',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          {
            type: 'dapp',
            icon: svg.cube(16),
            label: 'cowswap',
            onClick: () => {
              link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
            }
          },
          { type: 'break' },
          {
            type: 'space',
            icon: svg.dapps(16),
            label: 'Dapps',
            onClick: () => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'dapps' })
            }
          }
        ].map(({ type, icon, label, onClick }, index) => {
          const [width, height, shadow, borderRadius, contentScale] = calculateStyling(index)
          if (type === 'break') return <DockIconBreak key={index} />
          return (
            <DockIcon
              key={index}
              animate={animateIconSize}
              onClick={onClick}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                boxShadow: `
                0px ${shadow * 1.5}px ${shadow * 1.5}px -${shadow * 1.5}px var(--ghostY)`,
                borderRadius: `${borderRadius}px`
              }}
              onMouseEnter={() => setHoveredIcon(index)} // Step 2: Update hoveredIcon on mouse enter
              onMouseLeave={() => setHoveredIcon(null)} // Step 2: Reset hoveredIcon on mouse leave
              ref={(el) => (iconsRef.current[index] = el)}
            >
              <Label isVisible={hoveredIcon === index} height={height}>
                {label}
              </Label>
              <div style={{ transform: `scale(${contentScale})` }}>{icon}</div>
            </DockIcon>
          )
        })}
      </DockCard>
    </DockWrap>
  )
}

const ViewFooter = styled.div`
  height: 90px;
  width: calc(100% - 408px);
  margin: -43px auto 0 auto;
  border-bottom-right-radius: 8px;
  border-bottom-left-radius: 8px;
  box-shadow: 0px 0px 8px var(--ghostX), 0px 0px 0px 500px var(--ghostZ);
  z-index: 999;
`

let hideTimeout
export default () => {
  const frameState = useStore('windows.workspaces', window.frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const { space } = nav

  const [hideDockWrap, setHideDockWrap] = useState(false)

  const setHide = () => {
    setHideDockWrap(true)
    clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      link.send('workspace:nav:update:data', window.frameId, { hidden: true })
    }, 500)
  }

  const setShow = () => {
    clearTimeout(hideTimeout)
    setHideDockWrap(false)
    link.send('workspace:nav:update:data', window.frameId, { hidden: false })
  }

  const hidden = false //  (nav.space === 'dapp' && hideDockWrap) || (nav.space !== 'dapp' && nav.space !== 'command')

  return (
    <>
      <GlobalStyle />
      <Wrap hide={hidden}>
        {space === 'dapp' && <ViewFooter />}
        <Dock />
      </Wrap>
    </>
  )
}
