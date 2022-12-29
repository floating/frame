import useCountdown from '../../Hooks/useCountdown'
import { ClusterRow, ClusterValue } from '../Cluster'
export default Countdown = ({ end, handleClick, title }) => {
  const ttl = useCountdown(end)
  return (
    <ClusterRow>
      <ClusterValue
        onClick={() => {
          handleClick()
        }}
      >
        <div className='clusterFocus'>
          <div>{title}</div>
          <div className='clusterFocusHighlight'>{ttl}</div>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}
