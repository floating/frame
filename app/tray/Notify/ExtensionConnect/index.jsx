import link from '../../../../resources/link'
import Confirm from '../../../../resources/Components/Confirm'
import { capitalize } from '../../../../resources/utils'

const ExtensionConnectNotification = ({ id, browser, onClose }) => {
  const respond = (accepted) => link.rpc('respondToExtensionRequest', id, accepted, onClose)

  return (
    <>
      <div className='notifyTitle'>Companion extension attempting to connect</div>
      <div className='notifyBody'>
        <div className='notifyBodyLine'>
          {`A new ${capitalize(
            browser
          )} extension is attempting to connect as “Frame Companion”, if you did not recently
          install Frame Companion please verify below`}
        </div>
        <div className='notifyBodyQuestion'>{`Extension id: ${id}`}</div>
      </div>
      <Confirm
        prompt='Allow this extension to connect?'
        acceptText='Accept'
        onAccept={() => respond(true)}
        onDecline={() => respond(false)}
      />
    </>
  )
}

export default ExtensionConnectNotification
