import Signer from '../../../main/signers/Signer'
import type { Breadcrumb } from '../../../main/windows/nav/breadcrumb'

export function signerPanelCrumb({ id }: Signer): Breadcrumb {
  return { view: 'expandedSigner', data: { signer: id } }
}

export function accountPanelCrumb(): Breadcrumb {
  return { view: 'accounts', data: {} }
}
