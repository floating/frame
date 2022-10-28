import type { Breadcrumb } from '../../../main/windows/nav/breadcrumb'

export function signerPanelCrumb (id: string): Breadcrumb {
  return { view: 'expandedSigner', data: { signer: id } }
}

export function accountPanelCrumb (): Breadcrumb {
  return { view: 'accounts', data: {} }
}
