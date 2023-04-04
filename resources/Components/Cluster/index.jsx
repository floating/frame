export const ClusterValue = ({
  children,
  style = {},
  onClick,
  grow = 1,
  pointerEvents = false,
  transparent = false,
  role
}) => {
  let valueClass = 'clusterValue'
  if (onClick) valueClass += ' clusterValueClickable'
  if (pointerEvents) valueClass += ' clusterValueInteractable'
  if (transparent) valueClass += ' clusterValueTransparent'
  style.flexGrow = grow
  return (
    <div className={valueClass} style={style} onClick={onClick} role={role}>
      {children}
    </div>
  )
}

export const ClusterRow = ({ children, style = {} }) => {
  return (
    <div className='clusterRow' style={style}>
      {children}
    </div>
  )
}

export const ClusterColumn = ({ children, style = {}, grow = 1, width }) => {
  style.flexGrow = grow
  if (width) {
    style.width = width
    style.minWidth = width
    style.maxWidth = width
  }
  return (
    <div className='clusterColumn' style={style}>
      {children}
    </div>
  )
}

export const Cluster = ({ children, style = {} }) => {
  return (
    <div className='cluster' style={style}>
      {children}
    </div>
  )
}

export const ClusterBox = ({ title, subtitle, children, style = {}, animationSlot = 0 }) => {
  style.animationDelay = 0.1 * animationSlot + 's'
  return (
    <div className='_txMain' style={style}>
      <div className='_txMainInner'>
        {title ? (
          <div className='_txLabel'>
            <div>{title}</div>
            {subtitle && (
              <span
                style={{
                  opacity: 0.9,
                  fontSize: '9px',
                  position: 'relative',
                  top: '0px',
                  left: '4px'
                }}
              >
                {`(${subtitle})`}
              </span>
            )}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}
