// Attached browser views
export type View = {
  id: string
  ens: string
  dappId: string
  session: string
  url: string
}

// In the state every workpsace window instace shas ane entry with the following shape:
export type Nav = {
  space: string
  data: any
  views: View[]
}

export type Workspace = {
  id: string
  fullscreen: boolean
  nav: Nav[]
  navForward: Nav[]
}
