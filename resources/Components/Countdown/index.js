import useCountdown from '../../Hooks/useCountdown'
import { ClusterRow, ClusterValue } from '../Cluster'
export default Countdown = ({ end, title }) => {
  const ttl = useCountdown(end)
  return (
    <ClusterRow>
      <ClusterValue>
        <div className='clusterFocus'>
          <div>{title}</div>
          <div className='clusterFocusHighlight'>{ttl}</div>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}
