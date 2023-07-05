import styled, { css, keyframes } from 'styled-components'

const colors = {
  inactive: {
    base: 'var(--outerspace)',
    up: 'var(--good)',
    down: 'var(--bad)'
  },
  active: {
    base: 'var(--outerspace)',
    up: 'var(--good)',
    down: 'var(--bad)'
  }
}

const createAnimation = (colors, steps) => keyframes`
  0%, 80% { transform: translateX(0); color: ${colors.base}; }
  85% { transform: translateX(${steps[0]}px); color: ${colors.up}; }
  90% { transform: translateX(${steps[1]}px); color: ${colors.down}; }
  95% { transform: translateX(${steps[2]}px); color: ${colors.base}; }
  100% { transform: translateX(0); }
`

const animations = {
  inactive: [
    createAnimation(colors.inactive, [0, -3, 0]),
    createAnimation(colors.inactive, [0, 5, 3]),
    createAnimation(colors.inactive, [0, -2, 4]),
    createAnimation(colors.inactive, [0, 3, -2]),
    createAnimation(colors.inactive, [0, -2, -4]),
    createAnimation(colors.inactive, [0, -4, 1]),
    createAnimation(colors.inactive, [0, 2, 4]),
    createAnimation(colors.inactive, [0, 0, 2]),
    createAnimation(colors.inactive, [0, -3, -4]),
    createAnimation(colors.inactive, [0, -1, -1])
  ],
  active: [
    createAnimation(colors.active, [0, -3, 0]),
    createAnimation(colors.active, [0, 5, 3]),
    createAnimation(colors.active, [0, -2, 4]),
    createAnimation(colors.active, [0, 3, -2]),
    createAnimation(colors.active, [0, -2, -4]),
    createAnimation(colors.active, [0, -4, 1]),
    createAnimation(colors.active, [0, 2, 4]),
    createAnimation(colors.active, [0, 0, 2]),
    createAnimation(colors.active, [0, -3, -4]),
    createAnimation(colors.active, [0, -1, -1])
  ]
}

const GlitchWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ active }) => (active ? 'var(--outerspace)' : 'var(--outerspace)')};
`

const Line = styled.div`
  display: none;

  ${(props) =>
    props.on &&
    css`
      display: block;
      will-change: clip-path;
      position: ${(props) => (props.index > 0 ? 'absolute' : 'static')};
      animation: clip 3000ms ${(props) => -300 * props.index}ms linear infinite,
        ${(props) => props.animation} 1000ms ${(props) => -228 - 699 * (props.index % 10)}ms linear infinite;
    `}

  ${(props) =>
    !props.on &&
    props.lastLine &&
    css`
      display: block;
      opacity: 1;
    `}
`

const Glitch = ({ children, on, active }) => {
  return (
    <GlitchWrapper on={on} active={active}>
      {[...Array(10).keys()].map((i) => (
        <Line
          key={i + 'hg'}
          on={on}
          index={i}
          animation={active ? animations.active[i] : animations.inactive[i]}
        >
          {children}
        </Line>
      ))}
      {!on && <Line lastLine>{children}</Line>}
    </GlitchWrapper>
  )
}

export default Glitch
