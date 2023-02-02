import link from '../../../../resources/link'

const ReloadSignerButton = ({ id }) => (
  <div
    className='signerControlOption'
    onMouseDown={() => {
      link.send('dash:reloadSigner', id)
    }}
  >
    Reload Signer
  </div>
)

export default ReloadSignerButton
