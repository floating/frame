// Attached browser views
export type View = {
  id: string
  ens: string
  dappId: string
  session: string
  url: string
}

// In the state, every workspace window instance has an entry with the following shape:
export type Nav = {
  space: string
  data: any
  views: View[]
}

export type Ribbon = {
  expanded: boolean
}

export type Workspace = {
  id: string
  fullscreen: boolean
  nav: Nav[]
  navForward: Nav[]
  ribbon: Ribbon
}
