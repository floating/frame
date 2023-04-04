import useCountdown from '../../Hooks/useCountdown'

const Countdown = ({ end, title, titleClass, innerClass }) => {
  const ttl = useCountdown(end)

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
