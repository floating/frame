import useCountdown from '../../Hooks/useCountdown'

export default Countdown = ({ end, title, titleClass, innerClass }) => {
  const ttl = useCountdown(end)
  return (
    <div className={titleClass}>
      <div>{title}</div>
      <div className={innerClass}>{ttl}</div>
    </div>
  )
}
