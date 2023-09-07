import { ChainHeader } from '../Components'
import Connection from '../Connection'
import Gas from '../../../../../../resources/Components/Monitor'
import { ClusterBox, Cluster } from '../../../../../../resources/Components/Cluster'

const ChainPreview = (props) => {
  const { type, id, primaryColor, icon, name, on } = props
  return (
    <div className='network'>
      <ChainHeader
        type={type}
        id={id}
        primaryColor={primaryColor}
        icon={icon}
        name={name}
        on={on}
        showExpand={true}
        showToggle={true}
      />
      {on && (
        <div className='chainModules'>
          <Cluster>
            <Connection {...props} />
            <Gas chainId={id} />
          </Cluster>
        </div>
      )}
    </div>
  )
}

export default ChainPreview
