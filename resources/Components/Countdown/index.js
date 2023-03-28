import useCountdown from '../../Hooks/useCountdown'

const Countdown = ({ end, title, titleClass, innerClass }) => {
  const ttl = isFinite(new Date(end)) ? useCountdown(end) : 'INVALID DATE'

  return (
    <div className={titleClass}>
      <div>{title}</div>
      <div className={innerClass} role='timer'>
        {ttl}
      </div>
    </div>
  )
}

export default Countdown
