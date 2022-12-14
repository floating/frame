export interface Breadcrumb {
  view: string
  data: any
}

type Step = 'confirm'

interface RequestData {
  step: Step
  accountId: string
  requestId: string
}

export interface RequestBreadcrumb extends Omit<Breadcrumb, 'view'> {
  view: 'requestView'
  data: RequestData
}
